const STRING_BANK_HEADER = 'BANKBINARYDT';

const code_input = document.getElementById('code_input');
const type_input = document.getElementById('type_input');
const amount_input = document.getElementById('amount_input');
const username_input = document.getElementById('username_input');

const submit_button = document.getElementById('submit');

const TRANSACTION_URL = 'http://localhost:3000/';

/**
 * Creates a Bank Transaction according the specified struct
 * 
 * ```c
 *  // This struct is going to use the data types for the application
 *
 * 
 *  Complete struct data in the binary form.
 *
 *  struct {
 *      int8_t[12] header; 
        int8_t[4] bank_code;  
 *      int8_t[16] username;
        int8_t[4] transaction_type;
 *      float64_t[3] amount;
 *      int8_t[4] termination_padding;
 *  }
 *  ```
 * IMPORTANT NOTE: Constants representing the length will be there for
 * each data type
 *
 */
function createBankTransaction(
    bank_code,
    username,
    transaction_type,
    amount,
) {
    const BANK_HEADER_LENGTH = 12;
    const BANK_CODE_LENGTH = 4;
    const USERNAME_LENGTH = 16;
    const TRANSACTION_TYPE_LENGTH = 4;
    const AMOUNT_LENGTH = 3;

    // Termination string BANKED to end the transaction
    const TERMINATION_LENGTH = 4;

    // All the communication is Little Endian so 
    // we can make use of typed array views
    // Further more, we know the architecture of 
    // our server side and it's going to be little endian too 
    const IS_LITTLE_ENDIAN = true;

    const abf = new ArrayBuffer(64);
    
    // Pointer where we are going to start reading
    // the file from
    let pointer = 0;

    // Typed Array Views that are required for this data format
    const header_view = new Uint8Array(abf, pointer, BANK_HEADER_LENGTH);
    pointer += BANK_HEADER_LENGTH;  // Incrementing point by the length for each view
    
    const code_view = new Uint8Array(abf, pointer, BANK_CODE_LENGTH);
    pointer += BANK_CODE_LENGTH;

    const username_view = new Uint8Array(abf, pointer, USERNAME_LENGTH);
    pointer += USERNAME_LENGTH;

    const amount_view = new Float64Array(abf, pointer, AMOUNT_LENGTH);
    pointer += Float64Array.BYTES_PER_ELEMENT * AMOUNT_LENGTH;
    
    const transaction_type_view = new Uint8Array(abf, pointer, TRANSACTION_TYPE_LENGTH);
    pointer += TRANSACTION_TYPE_LENGTH;

    const termination_view = new Uint8Array(abf, pointer);


    header_view.set(encodeUTF8String(STRING_BANK_HEADER));
    code_view.set(encodeUTF8String(bank_code))
    username_view.set(encodeUTF8String(username));
    transaction_type_view.set(encodeUTF8String(transaction_type));
    
    amount_view[0] = amount;

    termination_view.set(encodeUTF8String('BEND'));

    return abf;
}

/**
 * Parses the ArrayBuffer Representation 
 * to provide meaningful output in the application.
 * 
 * TODO: Right now, we are just submitting the Array Buffer but in the future 
 * this can be extended by providing them with a binary representation 
 * to play with. Currently, this function is a noop.
 */
function parseRepresentation (buffer) {}

/**
 * Encodes UTF-8 String into a Uint8Array
 * @param {string} strVal
 * @return {Int8Array}
 */
function encodeUTF8String(strVal) {
    if (!strVal) {
        throw new Error('No `string` provided to encode into UTF-8')
    }

    const uint8Array = new Uint8Array(strVal.length);
    for (let i = 0; i < strVal.length; i++) {
        uint8Array[i] = strVal.charCodeAt(i);
    }

    return uint8Array;
}

/**
 * Code to send the transaction to the application
 */
function sendTransaction(arrayBuffer) {
    return axios.request({
        method: 'POST',
        responseType: 'arrayBuffer',
        headers: {
            'Content-Type': 'application/octet-stream'
        },
        data: arrayBuffer,
        url: TRANSACTION_URL
    });
}

/**
 * Sacrificing the global availability for
 * readability, this is more readable this way and allows 
 * for better anad managable code
 */
const formStatus = document.querySelector('.status');

/**
 * Logs error on the UI by writing the text
 */
function logError(error) {
    formStatus.innerHTML = 'Error occured. Check Log for more details';
    formStatus.className = 'status warning'
}

/**
 * Logs success message by add a `success` class to the UI
 */
function logSuccess() {
    formStatus.innerHTML = 'Operation successful! Feel free to play with the buffer accessible under <code>window.transaction</code>';
    formStatus.className = 'status success';
}

/**
 * Submit Button Handler to be displayed 
 * in the application
 */
submit_button.addEventListener('click', function (event) {
    // Values at the time of submission    
    const code = code_input.value.slice(0, 3);
    const type = type_input.value.slice(0, 4);
    const username = username_input.value.slice(0, 16);
    const amount = Number.parseFloat(amount_input.value);

    try {
        const bank_transaction = createBankTransaction(
            code,
            username,
            type,
            amount
        );

        window.transaction = bank_transaction;
        logSuccess(bank_transaction);
        // Transaction can be sent here by
        // sendTransaction call in the future
    } catch (error) {
        console.error(error);
        logError(error);
    }
});