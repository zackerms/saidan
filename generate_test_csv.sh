#!/bin/bash

# 10万行のCSVファイルを生成（高速版）
# ヘッダー行 + 10万行のデータ

# tmpディレクトリを作成（存在しない場合）
mkdir -p tmp

# awkを使用して高速に生成
awk 'BEGIN {
  print "id,name,email,age,city,country"
  for (i=1; i<=100000; i++) {
    age = 20 + (i % 50)
    city = "City" (i % 100)
    country = "Country" (i % 10)
    printf "%d,User%d,user%d@example.com,%d,%s,%s\n", i, i, i, age, city, country
  }
}' > tmp/test_100k.csv

echo "Generated tmp/test_100k.csv with 100,000 rows"
wc -l tmp/test_100k.csv
