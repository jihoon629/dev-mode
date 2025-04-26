/*
Copyright IBM Corp. 2016 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

		 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ABstore Chaincode implementation
type ABstore struct {
	contractapi.Contract
}

const feeAccount = "Bank"

// InitLedger는 초기 데이터를 원장에 추가합니다.
func (t *ABstore) InitLedger(ctx contractapi.TransactionContextInterface, A string, Aval int, B string, Bval int) error {

	err := ctx.GetStub().PutState(feeAccount, []byte(strconv.Itoa(0))) // 예: 수수료 계정 0으로 초기화
	if err != nil {
		return fmt.Errorf("failed to put state for fee account: %w", err)
	}
	return nil
}


func (t *ABstore) WithdrawMoney(ctx contractapi.TransactionContextInterface, id string, amountStr string) error {
	fmt.Printf("WithdrawMoney called for ID: %s, Amount: %s\n", id, amountStr)

	// 1. 출금액 문자열을 정수로 변환
	amount, err := strconv.Atoi(amountStr)
	if err != nil {
		return fmt.Errorf("invalid amount format '%s': %v", amountStr, err)
	}

	// 2. 출금액이 양수인지 확인
	if amount <= 0 {
		return fmt.Errorf("withdrawal amount must be a positive value, received %d", amount)
	}

	// 3. 원장에서 현재 지갑(ID)의 잔액 조회
	balanceBytes, err := ctx.GetStub().GetState(id)
	if err != nil {
		return fmt.Errorf("failed to read wallet %s from world state: %v", id, err)
	}
	if balanceBytes == nil {
		return fmt.Errorf("the wallet %s does not exist", id)
	}

	// 4. 현재 잔액 바이트를 정수로 변환
	currentBalance, _ := strconv.Atoi(string(balanceBytes))

	// 5. 잔액이 출금액보다 충분한지 확인
	if currentBalance < amount {
		return fmt.Errorf("insufficient funds for withdrawal: wallet %s has %d, tried to withdraw %d", id, currentBalance, amount)
	}

	// 6. 새로운 잔액 계산 (현재 잔액 - 출금액)
	newBalance := currentBalance - amount
	fmt.Printf("Updating balance for %s: %d - %d = %d\n", id, currentBalance, amount, newBalance)

	// 7. 계산된 새로운 잔액을 문자열로 변환하여 원장에 저장
	err = ctx.GetStub().PutState(id, []byte(strconv.Itoa(newBalance)))
	if err != nil {
		return fmt.Errorf("failed to update wallet %s balance after withdrawal: %v", id, err)
	}

	fmt.Printf("Wallet %s balance updated successfully to %d after withdrawal\n", id, newBalance)
	return nil // 성공 시 nil 반환
}





func (t *ABstore) DepositMoney(ctx contractapi.TransactionContextInterface, id string, amountStr string) error {
	fmt.Printf("DepositMoney called for ID: %s, Amount: %s\n", id, amountStr)

	// 1. 입금액 문자열을 정수로 변환
	amount, err := strconv.Atoi(amountStr)
	if err != nil {
		// 변환 실패 시 오류 반환 (잘못된 숫자 형식)
		return fmt.Errorf("invalid amount format '%s': %v", amountStr, err)
	}

	// 2. 입금액이 양수인지 확인
	if amount <= 0 {
		return fmt.Errorf("deposit amount must be a positive value, received %d", amount)
	}

	// 3. 원장에서 현재 지갑(ID)의 잔액 조회
	balanceBytes, err := ctx.GetStub().GetState(id)
	if err != nil {
		// 원장 조회 중 오류 발생 시
		return fmt.Errorf("failed to read wallet %s from world state: %v", id, err)
	}
	if balanceBytes == nil {
		// 해당 ID의 지갑이 존재하지 않는 경우
		return fmt.Errorf("the wallet %s does not exist", id)
	}

	// 4. 현재 잔액 바이트를 정수로 변환
	currentBalance, _ := strconv.Atoi(string(balanceBytes)) // GetState가 성공했으므로 변환 오류는 거의 없음

	// 5. 새로운 잔액 계산 (현재 잔액 + 입금액)
	newBalance := currentBalance + amount
	fmt.Printf("Updating balance for %s: %d + %d = %d\n", id, currentBalance, amount, newBalance)

	// 6. 계산된 새로운 잔액을 문자열로 변환하여 원장에 저장 (덮어쓰기)
	err = ctx.GetStub().PutState(id, []byte(strconv.Itoa(newBalance)))
	if err != nil {
		// 원장 저장 중 오류 발생 시
		return fmt.Errorf("failed to update wallet %s balance: %v", id, err)
	}

	fmt.Printf("Wallet %s balance updated successfully to %d\n", id, newBalance)
	return nil // 성공 시 nil 반환
}


func (t *ABstore) Init(ctx contractapi.TransactionContextInterface, A string, Aval int) error {
	fmt.Println("ABstore Init")
	var err error
	// Initialize the chaincode
	fmt.Printf("Aval = %d \n", Aval)
	// Write the state to the ledger
	err = ctx.GetStub().PutState(A, []byte(strconv.Itoa(Aval)))
	if err != nil {
		return err
	}


	return nil
}

// Transaction makes payment of X units from A to B
func (t *ABstore) Invoke(ctx contractapi.TransactionContextInterface, A, B string, X int) error {
	var err error
	var Aval int
	var Bval int
	var Feeval int // 수수료 계정 잔액 변수 (이전의 Cval 대신)

	// A 계정 상태 가져오기
	Avalbytes, err := ctx.GetStub().GetState(A)
	if err != nil {
		return fmt.Errorf("failed to get state for A: %w", err)
	}
	if Avalbytes == nil {
		return fmt.Errorf("entity A not found")
	}
	Aval, _ = strconv.Atoi(string(Avalbytes))

	// B 계정 상태 가져오기
	Bvalbytes, err := ctx.GetStub().GetState(B)
	if err != nil {
		return fmt.Errorf("failed to get state for B: %w", err)
	}
	if Bvalbytes == nil {
		return fmt.Errorf("entity B not found")
	}
	Bval, _ = strconv.Atoi(string(Bvalbytes))

	// 수수료 계정(상수 feeAccount) 상태 가져오기 (C 대신 feeAccount 사용)
	Feevalbytes, err := ctx.GetStub().GetState(feeAccount)
	if err != nil {
		return fmt.Errorf("failed to get state for fee account %s: %w", feeAccount, err)
	}
	if Feevalbytes == nil {
		// 수수료 계정이 원장에 없는 경우 초기화 (선택 사항)
		// return fmt.Errorf("fee account %s not found", feeAccount)
		Feeval = 0 // 또는 0으로 간주
	} else {
		Feeval, _ = strconv.Atoi(string(Feevalbytes))
	}


	// 실행: 잔액 계산
	Aval = Aval - X
	Bval = Bval + (X - X/10)
	Feeval = Feeval + (X / 10) // 수수료 계정 잔액 업데이트
	fmt.Printf("Aval = %d, Bval = %d, Feeval (%s) = %d\n", Aval, Bval, feeAccount, Feeval)

	// 상태 업데이트: A 계정
	err = ctx.GetStub().PutState(A, []byte(strconv.Itoa(Aval)))
	if err != nil {
		return err
	}

	// 상태 업데이트: B 계정
	err = ctx.GetStub().PutState(B, []byte(strconv.Itoa(Bval)))
	if err != nil {
		return err
	}

	// 상태 업데이트: 수수료 계정 (C 대신 feeAccount 사용)
	err = ctx.GetStub().PutState(feeAccount, []byte(strconv.Itoa(Feeval)))
	if err != nil {
		return err
	}

	return nil
}
// Delete  an entity from state
func (t *ABstore) Delete(ctx contractapi.TransactionContextInterface, A string) error {

	// Delete the key from the state in ledger
	err := ctx.GetStub().DelState(A)
	if err != nil {
		return fmt.Errorf("Failed to delete state")
	}

	return nil
}

// Query callback representing the query of a chaincode
func (t *ABstore) Query(ctx contractapi.TransactionContextInterface, A string) (string, error) {
	var err error
	// Get the state from the ledger
	Avalbytes, err := ctx.GetStub().GetState(A)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + A + "\"}"
		return "", errors.New(jsonResp)
	}

	if Avalbytes == nil {
		jsonResp := "{\"Error\":\"Nil amount for " + A + "\"}"
		return "", errors.New(jsonResp)
	}

	jsonResp := "{\"Name\":\"" + A + "\",\"Amount\":\"" + string(Avalbytes) + "\"}"
	fmt.Printf("Query Response:%s\n", jsonResp)
	return string(Avalbytes), nil
}

func (t *ABstore) GetAllQuery(ctx contractapi.TransactionContextInterface) ([]string, error) {
    resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
    if err != nil {
        return nil, err
    }
    defer resultsIterator.Close()
    var wallet []string
    for resultsIterator.HasNext() {
        queryResponse, err := resultsIterator.Next()
        if err != nil {
            return nil, err
        }
        jsonResp := "{\"Name\":\"" + string(queryResponse.Key) + "\",\"Amount\":\"" + string(queryResponse.Value) + "\"}"
        wallet = append(wallet, jsonResp)
    }
    return wallet, nil
}

func main() {
	cc, err := contractapi.NewChaincode(new(ABstore))
	if err != nil {
		panic(err.Error())
	}
	if err := cc.Start(); err != nil {
		fmt.Printf("Error starting ABstore chaincode: %s", err)
	}
}
