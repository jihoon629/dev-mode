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

func (t *ABstore) Init(ctx contractapi.TransactionContextInterface, A string, Aval int, B string, Bval int, C string, Cval int) error {
	fmt.Println("ABstore Init")
	var err error
	// Initialize the chaincode
	fmt.Printf("Aval = %d, Bval = %d, Cval = %d\n", Aval, Bval, Cval)
	// Write the state to the ledger
	err = ctx.GetStub().PutState(A, []byte(strconv.Itoa(Aval)))
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(B, []byte(strconv.Itoa(Bval)))
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(C, []byte(strconv.Itoa(Cval)))
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
