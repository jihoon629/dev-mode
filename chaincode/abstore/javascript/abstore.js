// chaincode/abstore/javascript/abstore.js
const shim = require('fabric-shim');
const util = require('util');

const ABstore = class {

  // Initialize the chaincode (Lifecycle method, called on instantiate or upgrade)
  async Init(stub) {
    console.info('========= ABstore Init (Lifecycle) =========');
    let ret = stub.getFunctionAndParameters();
    console.info('Function and parameters from stub: ', ret);
    // 보통 이 Init 함수는 초기 상태를 설정하거나 마이그레이션 로직을 수행합니다.
    // 여기서는 간단히 성공만 반환합니다.
    try {
      // 필요한 초기화 로직이 있다면 여기에 추가할 수 있습니다.
      // 예를 들어, 특정 관리자 계정 정보 설정 등.
      // let anAdmin = 'adminValue';
      // await stub.putState('adminKey', Buffer.from(anAdmin));
      return shim.success(Buffer.from('Chaincode Is Initialized'));
    } catch (err) {
      console.error('Failed to initialize chaincode (Lifecycle Init): ', err);
      return shim.error(err.toString());
    }
  }

  // Invoke is called per transaction after the Init function.
  async Invoke(stub) {
    console.info('========= ABstore Invoke (Router) =========');
    let ret = stub.getFunctionAndParameters();
    console.info('Function to invoke: ', ret.fcn);
    console.info('Parameters: ', ret.params);

    let method = this[ret.fcn]; // 동적으로 함수를 매핑합니다. (예: this.init, this.invoke 등)
    if (!method) {
      console.error('No function named: ' + ret.fcn + ' found in ABstore');
      return shim.error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      console.info(`Calling method: ${ret.fcn}`);
      let payload = await method(stub, ret.params, this); // 'this'를 전달하여 다른 함수 호출 가능
      // 호출된 함수(예: init, invoke, query 등)가 shim.success 또는 shim.error를 반환해야 합니다.
      // payload는 Buffer 형태여야 합니다. shim.success()는 payload가 Buffer라고 가정합니다.
      return payload; // payload는 이미 shim.success(Buffer) 또는 shim.error(string) 형태일 것임
    } catch (err) {
      console.error(`Error during ${ret.fcn} invocation: `, err);
      // 여기서 err 객체가 Error 인스턴스인지, 아니면 shim.error의 결과(객체)인지 확인 필요
      // 만약 err가 이미 {status:..., message:...} 형태의 객체라면 그대로 반환
      if (err.status && err.message) {
        return err;
      }
      return shim.error(err.toString());
    }
  }

  // Custom init function to set initial asset values (called via Invoke)
  async init(stub, args) {
    console.info('========= ABstore init (user-defined) =========');
    if (args.length !== 4) {
      const errMsg = `Incorrect number of arguments. Expecting 4, got: ${args.length}. Usage: init(A_entity, A_value, B_entity, B_value)`;
      console.error(errMsg);
      return shim.error(errMsg);
    }

    let A_entity = args[0];
    let A_value_str = args[1];
    let B_entity = args[2];
    let B_value_str = args[3];

    console.info(`Received args for init: A_entity=${A_entity}, A_value=${A_value_str}, B_entity=${B_entity}, B_value=${B_value_str}`);

    if (!A_entity || !B_entity) {
        const errMsg = 'Entity names (A and B) must not be empty';
        console.error(errMsg);
        return shim.error(errMsg);
    }
    if (A_entity === B_entity) {
        const errMsg = 'Entity A and Entity B cannot be the same';
        console.error(errMsg);
        return shim.error(errMsg);
    }

    let A_value = parseInt(A_value_str);
    let B_value = parseInt(B_value_str);

    if (isNaN(A_value) || isNaN(B_value)) {
      const errMsg = `Expecting integer values for asset holdings. A_value received: '${A_value_str}', B_value received: '${B_value_str}'`;
      console.error(errMsg);
      return shim.error(errMsg);
    }

    try {
      await stub.putState(A_entity, Buffer.from(A_value.toString()));
      console.info(`State set for entity ${A_entity} to ${A_value}`);
      await stub.putState(B_entity, Buffer.from(B_value.toString()));
      console.info(`State set for entity ${B_entity} to ${B_value}`);
      return shim.success(Buffer.from(`Successfully initialized entities: ${A_entity} with ${A_value}, ${B_entity} with ${B_value}`));
    } catch (err) {
      const errMsg = `Failed to initialize state in init function: ${err.toString()}`;
      console.error(errMsg, err);
      return shim.error(errMsg);
    }
  }

  // Custom invoke function to transfer assets (called via Invoke)
  // This is a different 'invoke' than the main Invoke router.
  async invoke(stub, args) {
    console.info('========= ABstore invoke (transfer) =========');
    if (args.length !== 3) {
      const errMsg = `Incorrect number of arguments for transfer. Expecting 3, got: ${args.length}. Usage: invoke(From_entity, To_entity, Amount)`;
      console.error(errMsg);
      return shim.error(errMsg);
    }
    let From_entity = args[0];
    let To_entity = args[1];
    let amount_str = args[2];

    console.info(`Received args for transfer: From=${From_entity}, To=${To_entity}, Amount=${amount_str}`);

    if (!From_entity || !To_entity) {
      const errMsg = 'Asset holding entities (From and To) cannot be empty in transfer';
      console.error(errMsg);
      return shim.error(errMsg);
    }
    if (From_entity === To_entity) {
        const errMsg = 'From_entity and To_entity cannot be the same for a transfer';
        console.error(errMsg);
        return shim.error(errMsg);
    }


    try {
      let From_value_bytes = await stub.getState(From_entity);
      if (!From_value_bytes || From_value_bytes.length === 0) {
        const errMsg = `Failed to get state of asset holder (From_entity): ${From_entity}`;
        console.error(errMsg);
        return shim.error(errMsg);
      }
      let From_value = parseInt(From_value_bytes.toString());
      if (isNaN(From_value)) {
        const errMsg = `Stored value for asset (From_entity) ${From_entity} is not a valid number: ${From_value_bytes.toString()}`;
        console.error(errMsg);
        return shim.error(errMsg);
      }

      let To_value_bytes = await stub.getState(To_entity);
      if (!To_value_bytes || To_value_bytes.length === 0) {
        const errMsg = `Failed to get state of asset holder (To_entity): ${To_entity}`;
        console.error(errMsg);
        return shim.error(errMsg);
      }
      let To_value = parseInt(To_value_bytes.toString());
       if (isNaN(To_value)) {
        const errMsg = `Stored value for asset (To_entity) ${To_entity} is not a valid number: ${To_value_bytes.toString()}`;
        console.error(errMsg);
        return shim.error(errMsg);
      }

      let amount_to_transfer = parseInt(amount_str);
      if (isNaN(amount_to_transfer)) {
        const errMsg = `Expecting integer value for amount to be transferred. Got: '${amount_str}'`;
        console.error(errMsg);
        return shim.error(errMsg);
      }
      if (amount_to_transfer <= 0) {
        const errMsg = `Amount to transfer must be a positive integer. Got: ${amount_to_transfer}`;
        console.error(errMsg);
        return shim.error(errMsg);
      }

      if (From_value < amount_to_transfer) {
        const errMsg = `Insufficient funds for ${From_entity}. Has ${From_value}, needs ${amount_to_transfer}`;
        console.error(errMsg);
        return shim.error(errMsg);
      }

      From_value = From_value - amount_to_transfer;
      To_value = To_value + amount_to_transfer;
      console.info(util.format(`After transfer: ${From_entity} = %d, ${To_entity} = %d`, From_value, To_value));

      await stub.putState(From_entity, Buffer.from(From_value.toString()));
      await stub.putState(To_entity, Buffer.from(To_value.toString()));

      return shim.success(Buffer.from(`Transaction successful: Transferred ${amount_to_transfer} from ${From_entity} to ${To_entity}`));
    } catch (err) {
      const errMsg = `Failed to invoke (transfer) transaction: ${err.toString()}`;
      console.error(errMsg, err);
      return shim.error(errMsg);
    }
  }

  // Deletes an entity from state (called via Invoke)
  async delete(stub, args) {
    console.info('========= ABstore delete =========');
    if (args.length !== 1) {
      const errMsg = `Incorrect number of arguments for delete. Expecting 1, got: ${args.length}. Usage: delete(Entity_to_delete)`;
      console.error(errMsg);
      return shim.error(errMsg);
    }
    let Entity_to_delete = args[0];
    console.info(`Received arg for delete: Entity=${Entity_to_delete}`);
    if (!Entity_to_delete) {
        const errMsg = 'Entity name for delete cannot be empty';
        console.error(errMsg);
        return shim.error(errMsg);
    }

    try {
      let val = await stub.getState(Entity_to_delete);
      if (!val || val.length === 0) {
          const errMsg = `Entity ${Entity_to_delete} not found, cannot delete.`;
          console.warn(errMsg);
          return shim.error(errMsg); // 실패로 처리하여 클라이언트가 알 수 있도록 함
      }
      await stub.deleteState(Entity_to_delete);
      console.info(`Deleted entity ${Entity_to_delete} from state`);
      return shim.success(Buffer.from(`Successfully deleted entity ${Entity_to_delete}`));
    } catch (err) {
      const errMsg = `Failed to delete entity ${Entity_to_delete}: ${err.toString()}`;
      console.error(errMsg, err);
      return shim.error(errMsg);
    }
  }

  // query callback representing the query of a chaincode (called via Invoke)
  async query(stub, args) {
    console.info('========= ABstore query =========');
    if (args.length !== 1) {
      const errMsg = `Incorrect number of arguments for query. Expecting 1, got: ${args.length}. Usage: query(Entity_to_query)`;
      console.error(errMsg);
      return shim.error(errMsg);
    }
    let Entity_to_query = args[0];
    console.info(`Received arg for query: Entity=${Entity_to_query}`);
    if (!Entity_to_query) {
        const errMsg = 'Entity name for query cannot be empty';
        console.error(errMsg);
        return shim.error(errMsg);
    }

    try {
      let Value_bytes = await stub.getState(Entity_to_query);
      if (!Value_bytes || Value_bytes.length === 0) {
        const errMsg = `Failed to get state for entity ${Entity_to_query}. Entity may not exist.`;
        console.warn(errMsg); // 로그에는 경고로 남기지만
        return shim.error(errMsg); // 클라이언트에는 오류로 응답하여 명확히 함
      }
      console.info(`Query Response for ${Entity_to_query}: ${Value_bytes.toString()}`);
      // payload는 Buffer여야 하므로, getState에서 받은 바이트 배열을 그대로 반환
      return shim.success(Value_bytes);
    } catch (err) {
      const errMsg = `Failed to query entity ${Entity_to_query}: ${err.toString()}`;
      console.error(errMsg, err);
      return shim.error(errMsg);
    }
  }
};

shim.start(new ABstore());