JSON_FILES=$(find source tests deploy -name "*.json" -type f)

for f in $JSON_FILES
do
    echo "Validating $f as JSON"
    python3 -m json.tool $f
done