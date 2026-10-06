# WOL-Browser
Web Operation Logger for Browser (Chrome Extension)

### 使い方(Set up)
1.このリポジトリ(https://github.com/ogatash-lab/WOL-Browser.git) をクローン
```
git clone https://github.com/ogatash-lab/WOL-Browser.git
```
2.セキュリティを緩和したブラウザを起動
※--disable-web-securityフラグにより，アクセス制限を回避しています．

(cmd)
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:\chrome_dev"
```

(Powershell)
```
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:\chrome_dev"
```

3.ブラウザ右上の３点のアイコン(google chromeの設定)から[設定]→[拡張機能]→[パッケージ化されていない拡張機能を読み込む]と選択し，WOL-Browser/LogReaderExtentionを指定

## メモ
PNA(Private Network Access)制限等のセキュリティ強化により，以下の使用方法は使用可能であるが，推奨しない．
### Requirement
Google chrome拡張機能
・CORS Unblock

### 使い方(Set up)
1.このリポジトリ(https://github.com/ogatash-lab/WOL-Browser.git) をクローン
```
git clone https://github.com/ogatash-lab/WOL-Browser.git
```

2.ブラウザ右上の３点のアイコン(google chromeの設定)から[設定]→[拡張機能]→[パッケージ化されていない拡張機能を読み込む]と選択し，WOL-Browser/LogReaderExtentionを指定
