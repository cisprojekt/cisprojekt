import csv
import sys

csv.field_size_limit(2**30)
def crop_csv_file(input_file, output_file):
  with open(input_file, 'r') as file:
    reader = csv.reader(file)
    with open(output_file, 'w', newline='') as output:
      writer = csv.writer(output)
      for row in reader:
        cropped_row = [cell[:500] for cell in row]
        writer.writerow(cropped_row)

# Usage example
input_file = r"C:\Uni\Programming\CisProjekt\cisprojekt\testdata\sequence_data.csv"
output_file = r"C:\Uni\Programming\CisProjekt\cisprojekt\testdata\cropped_sequence_data.csv"
crop_csv_file(input_file, output_file)
