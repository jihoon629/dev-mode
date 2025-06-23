#!/bin/bash

if [ "$1" == "react" ]; then
  echo "React 애플리케이션을 시작합니다..."
  cd ./application/client-react
  npm start
else
  cd ./basic-network/
  cp -r ../../fabric-samples/bin/ .
  echo "바이너리 복사됨"
  echo "nvm 16으로 변경좀"

  cd ../

fi