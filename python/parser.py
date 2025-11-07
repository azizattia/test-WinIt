import sys
import json
from datetime import datetime
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional


class CourtRecordParser:
    def __init__(self, html_content: str):
        self.soup = BeautifulSoup(html_content, 'lxml')

    def parse_all_cases(self, first_name: str, last_name: str) -> Dict[str, Any]:
        cases = []
        case_records = self.soup.find_all('div', class_='case-record')

        for case_record in case_records:
            case_data = self._parse_single_case(case_record)
            if case_data:
                cases.append(case_data)

        return {
            "success": True,
            "totalCases": len(cases),
            "cases": cases,
            "query": {
                "firstName": first_name,
                "lastName": last_name
            }
        }

    def _parse_single_case(self, case_record) -> Optional[Dict[str, Any]]:
        try:
            return {
                "caseInfo": self._parse_case_info(case_record),
                "parties": self._parse_parties(case_record),
                "hearings": self._parse_hearings(case_record),
                "financials": self._parse_financials(case_record),
                "sourceMetadata": {
                    "sourceUrl": "https://portal.scscourt.org/search",
                    "scrapeTimestamp": datetime.utcnow().isoformat() + "Z",
                    "dataSource": "mock"
                }
            }
        except Exception as e:
            print(f"Error parsing case: {str(e)}", file=sys.stderr)
            return None

    def _parse_case_info(self, case_record) -> Dict[str, str]:
        case_info_section = case_record.find('div', class_='case-info')

        return {
            "caseNumber": self._extract_text(case_info_section, 'case-number'),
            "filingDate": self._extract_text(case_info_section, 'filing-date'),
            "caseType": self._extract_text(case_info_section, 'case-type'),
            "status": self._extract_text(case_info_section, 'case-status'),
            "courtLocation": self._extract_text(case_info_section, 'court-location')
        }

    def _parse_parties(self, case_record) -> List[Dict[str, str]]:
        parties = []
        parties_section = case_record.find('div', class_='parties-section')

        if not parties_section:
            return parties

        party_rows = parties_section.find_all('tr', class_='party-row')

        for row in party_rows:
            cells = row.find_all('td')
            if len(cells) >= 2:
                party = {
                    "name": cells[0].get_text(strip=True),
                    "role": cells[1].get_text(strip=True)
                }
                if len(cells) >= 3:
                    party["details"] = cells[2].get_text(strip=True)
                parties.append(party)

        return parties

    def _parse_hearings(self, case_record) -> List[Dict[str, str]]:
        hearings = []
        hearings_section = case_record.find('div', class_='hearings-section')

        if not hearings_section:
            return hearings

        hearing_rows = hearings_section.find_all('tr', class_='hearing-row')

        for row in hearing_rows:
            cells = row.find_all('td')
            if len(cells) >= 2:
                hearing = {
                    "dateTime": cells[0].get_text(strip=True),
                    "type": cells[1].get_text(strip=True)
                }
                if len(cells) >= 3:
                    hearing["department"] = cells[2].get_text(strip=True)
                if len(cells) >= 4:
                    hearing["judge"] = cells[3].get_text(strip=True)
                if len(cells) >= 5:
                    hearing["result"] = cells[4].get_text(strip=True)
                hearings.append(hearing)

        return hearings

    def _parse_financials(self, case_record) -> Optional[Dict[str, float]]:
        financial_section = case_record.find('div', class_='financial-section')

        if not financial_section:
            return None

        financials = {}

        fines_elem = financial_section.find('td', class_='fines')
        if fines_elem:
            financials['fines'] = self._parse_currency(fines_elem.get_text(strip=True))

        fees_elem = financial_section.find('td', class_='fees')
        if fees_elem:
            financials['fees'] = self._parse_currency(fees_elem.get_text(strip=True))

        balance_elem = financial_section.find('td', class_='balance')
        if balance_elem:
            financials['balance'] = self._parse_currency(balance_elem.get_text(strip=True))

        return financials if financials else None

    def _extract_text(self, parent, class_name: str) -> str:
        elem = parent.find(class_=class_name)
        return elem.get_text(strip=True) if elem else ""

    def _parse_currency(self, currency_str: str) -> float:
        try:
            cleaned = currency_str.replace('$', '').replace(',', '').strip()
            return float(cleaned)
        except (ValueError, AttributeError):
            return 0.0


def main():
    if len(sys.argv) != 4:
        print(json.dumps({
            "success": False,
            "error": "InvalidArguments",
            "message": "Usage: python parser.py <html_file_path> <first_name> <last_name>"
        }))
        sys.exit(1)

    html_file_path = sys.argv[1]
    first_name = sys.argv[2]
    last_name = sys.argv[3]

    try:
        with open(html_file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        parser = CourtRecordParser(html_content)
        result = parser.parse_all_cases(first_name, last_name)

        print(json.dumps(result, indent=2))

    except FileNotFoundError:
        print(json.dumps({
            "success": False,
            "error": "FileNotFound",
            "message": f"HTML fixture file not found: {html_file_path}"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": "ParsingError",
            "message": f"Error parsing HTML: {str(e)}"
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
