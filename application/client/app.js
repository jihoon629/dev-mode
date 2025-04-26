'use strict';

var app = angular.module('application', []);

app.controller('AppCtrl', function($scope, appFactory){
  // 초기화 및 숨김 처리
  $("#success_init").hide();
  $("#success_qurey").hide();
  $("#success_invoke").hide();
  $("#success_delete").hide();
  $("#success_query_all").hide(); // Query All 성공 메시지 숨김
  $("#error_invoke").hide();
  $("#error_delete").hide();
  $("#error_query_all").hide(); // Query All 에러 메시지 숨김
  $("#error_query").hide(); // Query 에러 메시지 숨김 추가
  $scope.query_all_result = []; // 결과 배열 초기화


   $scope.initAB = function(){
       appFactory.initAB($scope.abstore, function(data){
           // 응답 처리는 기존과 동일하게 유지하거나 필요에 따라 수정
           if(data == "")
           $scope.init_ab = "success";
           $("#success_init").show();
           $("#error_invoke").hide();
           $("#error_delete").hide();
       });
   }
//    $scope.queryAB = function(){
//        // Query 부분은 변경하지 않음 (파라미터 이름 불일치 문제는 별도)
//        appFactory.queryAB($scope.walletid, function(data){
//            $scope.query_ab = data;
//            $("#success_qurey").show();
//            $("#error_invoke").hide();
//            $("#error_delete").hide();
//        });
//    }
$scope.queryAB = function(){
    // walletid는 index.html의 ng-model="walletid"와 일치
    var walletIdToQuery = $scope.walletid;
    $("#success_qurey").hide(); // 이전 결과 숨김
    $("#error_query").hide();   // 이전 오류 숨김

    appFactory.queryAB(walletIdToQuery, function(data, status){ // status 인자 추가
        if (status === 200) { // HTTP 200 OK: 성공
            // 성공 응답 처리
            try {
                if (typeof data === 'object') { // sdk.js 에서 이미 파싱된 경우
                    $scope.query_ab = JSON.stringify(data, null, 2);
                } else {
                    // 체인코드가 값만 반환하는 현재 로직 기준
                    $scope.query_ab = "Account: " + walletIdToQuery + "\nValue: " + data;
                }
            } catch(e) {
                 $scope.query_ab = data; // 파싱 실패 시 원본 표시
            }
            $("#success_qurey").show(); // 성공 메시지 표시
        } else { // HTTP 200 이 아닌 경우: 오류 발생
            var errorMsg = "Query failed: ";
            // 오류 응답(data) 내용 분석
            // (체인코드 오류 메시지가 "account not found" 인 경우 data.error.includes 사용)
            // 현재 체인코드 오류 메시지("Nil amount for") 기준
            if (data && data.error && data.error.includes("Nil amount for " + walletIdToQuery)) {
               errorMsg = "Account '" + walletIdToQuery + "' not found.";
            } else if (data && data.error) { // 서버에서 보낸 다른 오류 메시지가 있는 경우
               errorMsg += data.error;
            } else if (typeof data === 'string' && data.length > 0) { // 오류 응답이 문자열인 경우
                errorMsg += data;
            } else { // 기타 오류
               errorMsg += "Status " + status + " - " + JSON.stringify(data);
            }
            $scope.query_ab_error = errorMsg; // 에러 스코프 변수에 저장
            $("#error_query").show(); // 에러 메시지 표시
        }
        // 다른 섹션 메시지 숨김 (Query 오류 발생 시에도 다른 성공/오류는 숨김)
        $("#success_init").hide();
        $("#success_invoke").hide();
        $("#success_delete").hide();
        $("#success_query_all").hide();
        $("#error_invoke").hide();
        $("#error_delete").hide();
        $("#error_query_all").hide();
    });
}

 // Invoke 함수 추가
 $scope.invoke = function(){
    // 입력값 가져오기 (index.html의 ng-model과 일치해야 함: invokeData.A, invokeData.B, invokeData.X)
    appFactory.invoke($scope.invokeData, function(data, status){
        $("#success_invoke").hide(); // 이전 메시지 숨김
        $("#error_invoke").hide();
        if(status === 200 && data === "") { // 성공 응답 (body가 비어있음)
            $scope.invoke_result = "Transaction Invoke successful!";
            $("#success_invoke").show();
        } else { // 오류 응답
            $scope.invoke_error = "Invoke failed: " + (data.error || JSON.stringify(data)); // 오류 메시지 표시
            $("#error_invoke").show();
        }
        $("#success_init").hide(); // 다른 섹션 메시지 숨김
        $("#success_qurey").hide();
        $("#success_delete").hide();
        $("#error_delete").hide();
    });
}

// Delete 함수 추가
$scope.deleteAccount = function(){
    // 입력값 가져오기 (index.html의 ng-model과 일치해야 함: deleteName)
    appFactory.deleteAccount($scope.deleteName, function(data, status){
        $("#success_delete").hide(); // 이전 메시지 숨김
        $("#error_delete").hide();
        if(status === 200 && data === "") { // 성공 응답 (body가 비어있음)
             $scope.delete_result = "Account '" + $scope.deleteName + "' deleted successfully!";
            $("#success_delete").show();
        } else { // 오류 응답
            $scope.delete_error = "Delete failed: " + (data.error || JSON.stringify(data)); // 오류 메시지 표시
            $("#error_delete").show();
        }
         $("#success_init").hide(); // 다른 섹션 메시지 숨김
         $("#success_qurey").hide();
         $("#success_invoke").hide();
         $("#error_invoke").hide();
    });
}


 // Query All 함수 추가
 $scope.queryAll = function(){
    console.log("Query All button clicked.");
    $scope.query_all_result = [];
    appFactory.queryAll(function(data, status){
        console.log("Received response from /queryAll - Status:", status);
        $("#error_query_all").hide();
        if(status === 200) {
            console.log("Raw data received:", data);
            try {
                let firstParsedData; // 첫 번째 파싱 결과를 담을 변수
                let finalResultArray = []; // 최종 객체 배열을 담을 변수

                // 서버 응답이 문자열인지 확인
                if (typeof data === 'string') {
                    console.log("Data is a string, attempting first JSON.parse().");
                    firstParsedData = JSON.parse(data); // 첫 번째 파싱: JSON 문자열 배열 -> JS 문자열 배열
                    
                } else if (Array.isArray(data)) {
                    // sdk.js 에서 이미 첫번째 파싱을 했을 수도 있음
                    console.log("Data is already an array (likely pre-parsed).");
                    firstParsedData = data;
                } else {
                     console.error("Received data is neither a string nor an array:", data);
                     throw new Error("Unexpected data format received.");
                }


                // 첫 번째 파싱 결과가 배열인지 확인
                if (Array.isArray(firstParsedData)) {
                    console.log("First parse result is an array. Attempting second parse on each element.");
                    // 배열의 각 문자열 요소를 순회하며 두 번째 파싱 수행
                    for (let i = 0; i < firstParsedData.length; i++) {
                        try {
                            // 각 요소가 문자열인지 확인 후 파싱
                            if (typeof firstParsedData[i] === 'string') {
                                finalResultArray.push(JSON.parse(firstParsedData[i])); // 두 번째 파싱: JSON 문자열 -> JS 객체
                            } else if (typeof firstParsedData[i] === 'object') {
                                // 이미 객체 형태일 경우 (예: sdk.js 에서 이중 파싱까지 한 경우)
                                finalResultArray.push(firstParsedData[i]);
                            } else {
                                console.warn("Skipping non-string/non-object element in array:", firstParsedData[i]);
                            }
                        } catch (parseError) {
                             console.error("Error parsing element at index " + i + ":", firstParsedData[i], parseError);
                             // 파싱 오류가 난 요소는 건너뛰거나, 오류 처리를 할 수 있음
                        }
                    }
                    $scope.query_all_result = finalResultArray; // <<< 최종 객체 배열을 scope에 할당
                    console.log("Assigned scope data ($scope.query_all_result):", $scope.query_all_result);
                } else {
                    console.error("First parse result is not an array:", firstParsedData);
                    throw new Error("Result after first parse is not an array.");
                }
            } catch (e) {
                // 파싱 실패
                console.error("Error processing queryAll result:", e);
                console.error("Original data:", data);
                $scope.query_all_error = "Failed to process Query All result.";
                $scope.query_all_result = [];
                $("#error_query_all").show();
            }
        } else { // 오류 응답
            console.error("API call failed.");
            console.error("Error status:", status, "Error data:", data);
            $scope.query_all_error = "Query All failed: " + (data.error || JSON.stringify(data));
            $scope.query_all_result = [];
            $("#error_query_all").show();
        }
 
        // 다른 섹션 메시지 숨김 (필요시)
        $("#success_init").hide();
        $("#success_qurey").hide();
        $("#success_invoke").hide();
        $("#success_delete").hide();
        $("#error_invoke").hide();
        $("#error_delete").hide();
        $("#error_query").hide();
    });
}

});
app.factory('appFactory', function($http){

    var factory = {};

    factory.initAB = function(data, callback){
        // GET 요청 URL에 c와 cval 파라미터 추가
        $http.get('/init?a='+data.a+'&aval='+data.aval+'&b='+data.b+'&bval='+data.bval+'&c='+data.c+'&cval='+data.cval).success(function(output){
            callback(output)
        });
    }
    // factory.queryAB = function(name, callback){
    //     // Query 부분은 변경하지 않음 (파라미터 이름 불일치 문제는 별도)
    //     $http.get('/query?name='+name).success(function(output){
    //         callback(output)
    //     });
        
    // }
    factory.queryAB = function(name, callback){
        $http.get('/query?name='+name)
            .success(function(output){
                // 성공 시 output과 상태코드 200 전달
                callback(output, 200);
            })
            .error(function(output, status){
                // 오류 시 output과 해당 상태코드 전달
                callback(output, status);
            });
    }



       // invoke 팩토리 함수 추가
       factory.invoke = function(data, callback){
        $http.get('/invoke?A='+data.A+'&B='+data.B+'&X='+data.X)
            .success(function(output){ callback(output, 200); })
            .error(function(output, status){ callback(output, status); });
    }

    // delete 팩토리 함수 추가
    factory.deleteAccount = function(name, callback){
        $http.get('/delete?name='+name)
            .success(function(output){ callback(output, 200); })
            .error(function(output, status){ callback(output, status); });
    }


    // queryAll 팩토리 함수 추가
    factory.queryAll = function(callback){
        
        // 주의: server.js 엔드포인트 이름이 '/queryAll' 인지 '/queryall'인지 확인 필요
        // 현재 server.js 에는 '/queryAll'로 되어 있으므로 그대로 사용
        $http.get('/queryAll') // 대소문자 구분 주의
            .success(function(output){ callback(output, 200); })
            .error(function(output, status){ callback(output, status); });
    }
    return factory;
 });