from dotenv import load_dotenv
from app.services.abuseipdb import check_ip

load_dotenv()

result = check_ip("8.8.8.8")

print(result)
