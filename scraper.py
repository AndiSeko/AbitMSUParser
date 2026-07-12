import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

URL = "https://abitasu.msu.by/result/zaiv1Z.html"
TARGET_SPECIALTY = "Программная инженерия"


def parse_num(text):
    text = text.strip().replace('\xa0', '')
    try:
        return int(text)
    except ValueError:
        return 0


def parse_page():
    response = requests.get(URL, timeout=30)
    response.encoding = 'utf-8'
    html = response.text
    soup = BeautifulSoup(html, 'html.parser')

    date_m = re.search(r'Данные на\s*<b>(.*?)</b>', html)
    date_str = date_m.group(1).strip() if date_m else ''

    form_m = re.search(r'Форма получения образования\s*<b>(.*?)</b>', html)
    form_str = form_m.group(1).strip() if form_m else ''

    type_m = re.search(r'для получения образования в\s*<b>(.*?)</b>', html)
    type_str = type_m.group(1).strip() if type_m else ''

    funding_m = re.search(r'Прием осуществляется\s*<b>(.*?)</b>', html)
    funding_str = funding_m.group(1).strip() if funding_m else ''

    table = soup.find('table', class_='border')
    if not table:
        return None

    rows = table.find_all('tr')

    score_ranges = []
    for row in rows:
        classes = row.get('class', [])
        if 'head1' not in classes:
            continue
        cells = row.find_all('td')
        if len(cells) < 10:
            continue
        texts = []
        for c in cells:
            t = c.get_text('\n', strip=True).replace('\n', '').replace('\r', '').strip()
            texts.append(t)
        if 'по конкурсу' in texts:
            idx = texts.index('по конкурсу')
            for t in texts[idx + 1:]:
                score_ranges.append(t)
            break

    specialties = []
    current_faculty = None

    for row in rows:
        classes = row.get('class', [])
        cells = row.find_all('td')

        if 'head1' in classes and len(cells) == 1:
            b_tag = cells[0].find('b')
            if b_tag:
                current_faculty = b_tag.text.strip()
            continue
        if 'head1' in classes:
            continue
        if len(cells) < 10:
            continue

        specialty_name = cells[2].text.strip()

        if TARGET_SPECIALTY.lower() not in specialty_name.lower():
            continue

        plan = parse_num(cells[3].text)
        target_plan = parse_num(cells[4].text)
        total_apps = parse_num(cells[5].text)
        target_apps = parse_num(cells[6].text)
        without_exams = parse_num(cells[7].text)
        out_of_comp = parse_num(cells[8].text)
        by_comp = parse_num(cells[9].text)

        dist = {}
        for i, cell in enumerate(cells[10:]):
            if i < len(score_ranges):
                val = cell.text.strip().replace('\xa0', '')
                dist[score_ranges[i]] = parse_num(val)

        specialties.append({
            'faculty': current_faculty,
            'name': specialty_name,
            'group_number': cells[0].text.strip(),
            'group_count': cells[1].text.strip(),
            'plan': plan,
            'target_plan': target_plan,
            'total_applications': total_apps,
            'target_applications': target_apps,
            'without_exams': without_exams,
            'out_of_competition': out_of_comp,
            'by_competition': by_comp,
            'score_distribution': dist,
            'competition': round(total_apps / plan, 2) if plan > 0 else 0
        })

    return {
        'last_updated': date_str,
        'education_form': form_str,
        'education_type': type_str,
        'funding': funding_str,
        'fetched_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'specialties': specialties
    }


if __name__ == '__main__':
    data = parse_page()
    if data:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("Saved to data.json")
    else:
        print("Failed to parse")
