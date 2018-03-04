/**********************************************************
 * Serialization
 **********************************************************/
/**
 * Serialize an value to array of bytes.
 * @param {any} value Value to serialize.
 * @returns {ArrayBuffer} bytes array.
 */
export declare function serialize(value: any): ArrayBuffer;
/**
 * Calculates the bytes of serialized value.
 * @param {any} value Value to serialize.
 * @returns {number} Byte count.
 */
export declare function bytesOfSerialized(value: any): number;
/**
 * Writes bytes of serialized value.
 * @param {number} number Float number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 */
export declare function writeSerialized(value: any, buffer: Uint8Array, offset: number): number;
/**********************************************************
 * Deserialization
 **********************************************************/
export interface ReadResult {
    value: any;
    bytes: number;
}
/**
 * Deserialize an array of bytes.
 * @param {Uint8Array|ArrayBuffer} data Data to deserialize.
 * @returns {ArrayBuffer} deserialized value.
 */
export declare function deserialize(data: Uint8Array | ArrayBuffer): any;
/**
 * Read from bytes of serialized value.
 * @param {number} number Float number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 */
export declare function readSerialized(buffer: Uint8Array, offset: number): ReadResult;
/**
 * Reads bytes as a float32.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} offset Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
export declare function readFloat32(buffer: Uint8Array, offset: number): number;
/**
 * Writes an float as bytes.
 * @param {number} number Float number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 */
export declare function writeFloat32(number: number, buffer: Uint8Array, offset: number): number;
/**
 * Reads bytes as a float64.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} offset Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
export declare function readFloat64(buffer: Uint8Array, offset: number): number;
/**
 * Writes an float as bytes.
 * @param {number} number Float number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 */
export declare function writeFloat64(number: number, buffer: Uint8Array, offset: number): number;
/**
 * Calculates the bytes to store a positive integer.
 * @param {number} number number
 * @returns {number} Byte length
 */
export declare function bytesOfInt(number: number): number;
/**
 * Reads integer from bytes
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
export declare function readInt(buffer: Uint8Array, start: number, length: number, negative?: boolean): number;
/**
 * Writes an integer as bytes.
 * @param {number} number Positive number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
export declare function writeInt(number: number, buffer: Uint8Array, offset: number): number;
/**
 * Reads  bytes as a Date.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
export declare function readDate(buffer: Uint8Array, start: number, negative?: boolean): Date;
/**
 * Writes a date as bytes.
 * @param {Date} date Date Time
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
export declare function writeDate(date: Date, buffer: Uint8Array, offset: number): number;
/**
 * Calculates the VLQ byte length of positive integer.
 * @param {number} number number
 * @returns {number} Byte length
 */
export declare function bytesOfVql(number: number): number;
/**
 * Reads VLQ bytes as a intenter.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {ReadResult} an integer and bytes eaten.
 */
export declare function readVlq(buffer: Uint8Array, start: number): ReadResult;
/**
 * Writes an integer as VLQ bytes.
 * @param {number} number Positive number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
export declare function writeVql(number: number, buffer: Uint8Array, offset: number): number;
/**
 * Calculates the UTF8 byte length of a string.
 * @param {string} string String
 * @returns {number} Byte length
 */
export declare function bytesOfUtf8(string: string): number;
/**
 * Reads UTF8 bytes as a string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
export declare function readUtf8(buffer: Uint8Array, start: number, end: number): string;
/**
 * Writes a string as UTF8 bytes.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
export declare function writeUtf8(string: string, buffer: Uint8Array, offset: number): number;
