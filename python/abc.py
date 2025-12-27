import csv
import json

csv_file = "C:\\Users\\Praneeth\\OneDrive\\Desktop\\crimex2\\python\\clean_dataset.csv"
json_file = "crime_data.json"

data = []

with open(csv_file, mode="r", encoding="utf-8") as file:
    csv_reader = csv.DictReader(file)

    for row in csv_reader:

        # ✅ SAFE numeric conversions
        if "year" in row and row["year"]:
            row["year"] = int(float(row["year"]))

        if "cases" in row and row["cases"]:
            row["cases"] = int(float(row["cases"]))

        data.append(row)

with open(json_file, mode="w", encoding="utf-8") as file:
    json.dump(data, file, indent=4)

print("✅ CSV converted to JSON successfully!")
