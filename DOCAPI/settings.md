# Settings Module

Base: /settings
Protected: Authorization required

---

## GET /settings
Get company settings (companyName, address, phone, email, taxNumber, logo)

---

## PUT /settings
Update company settings
Content-Type: multipart/form-data
Form fields example:
- companyName
- address
- phone
- email
- taxNumber
- logo (file)
- removeLogo (boolean)

---

## Example request form-data
companyName: Motorbike POS Test Company
address: 123 Test Street, Test City
phone: +1-555-0123
email: test@motorbikepos.com
taxNumber: TAX123456789
logo: (file)
