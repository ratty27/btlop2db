ツールについて

●環境
python 3.7.x 以降が必要です。
また、追加のライブラリとして、xlrd, openpyxl が必要です。python インストール後、
    > pip install xlrd openpyxl
として、追加ライブラリをインストールしてください。

●説明
・btlop2_update_excel.py
　"btlop2.xlsx" の 'MS' シートに書かれたパラメータを元に、'Weapon1', 'Weapon2', 'SubWeapon', 'Skill'
の各シートに足りない項目を追加します。
　コマンドラインから
  > btlop2_update_excel.py ..\data\btlop2.xlsx
として実行してください。

・btlop2_tocsv.py
　"btlop2.xlsx" の各シートを csv に変換し、'html/db' のファイルに上書きします。
　同フォルダにある update.bat から呼び出されますので、update.bat で実行してください。

・btlop2_hash.py
　リリース時にサーバリクエスト用のファイルハッシュ値を更新するスクリプトです。
　このハッシュ値は、ブラウザキャッシュを避けるための仕組みで、必ずしも更新する必要のないパラメータです。
　ハッシュを更新せずに公開ファイルを更新した場合には、ユーザがスーパーリロードをしないと変更が反映されない可能性があるというものです。
  > btlop2_hash.py ..\html
として実行してください。

