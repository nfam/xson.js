

/**********************************************************
 * Serialization
 **********************************************************/

/**
 * Serialize an value to array of bytes.
 * @param {any} value Value to serialize.
 * @returns {ArrayBuffer} bytes array.
 */
export function serialize(value: any): ArrayBuffer {
    let bytes = bytesOfSerialized(value);
    let buffer = new Uint8Array(bytes);
    writeSerialized(value, buffer, 0);
    return buffer.buffer;
}

/**
 * Calculates the bytes of serialized value.
 * @param {any} value Value to serialize.
 * @returns {number} Byte count.
 */
export function bytesOfSerialized(value: any): number {
    if (value === undefined ||
        value === null ||
        value === true ||
        value === false
    ) {
        return 1;
    }
    switch(typeof value) {
    case 'string':
        return 1 + bytesOfUtf8(value) + 1;
    case 'number':
        if (isNaN(value)) {
            return 1;
        }
        return 1 + (value === Math.floor(value) ? bytesOfInt(value) : 8);
    case 'object':
        if (Array.isArray(value)) {
            let bytes = 1 + bytesOfVql(value.length);
            for (let i = 0; i < value.length; i += 1) {
                bytes += bytesOfSerialized(value[i]);
            }
            return bytes;
        }
        else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
            return 1 + bytesOfVql(value.byteLength) + value.byteLength;
        }
        else if (value instanceof Date) {
            return 1 + 6;
        }
        else {
            let bytes = 1;
            let count = 0;
            Object.keys(value).forEach(n => {
                let v = value[n];
                if (v !== undefined && typeof v !== 'symbol') {
                    count += 1;
                    bytes += bytesOfUtf8(n);
                    bytes += 1;
                    bytes += bytesOfSerialized(v);
                }
            });
            bytes += bytesOfVql(count);
            return bytes;
        }
    }
}

/**
 * Writes bytes of serialized value.
 * @param {number} number Float number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 */
export function writeSerialized(value: any, buffer: Uint8Array, offset: number): number {
    if (value === undefined ||
        value === null
    ) {
        buffer[offset++] = 0x00;
        return 1;
    }
    else if (value === true) {
        buffer[offset++] = 0x05;
        return 1;
    }
    else if (value === false) {
        buffer[offset++] = 0x06;
        return 1;
    }

    let start = offset;
    switch(typeof value) {
    case 'string':
        buffer[offset++] = 0x01;
        offset += writeUtf8(value, buffer, offset);
        buffer[offset++] = 0x00;
        break;
    case 'number':
        if (isNaN(value)) {
            buffer[offset++] = 0x00;
            return 1;
        }
        if (value === Math.floor(value)) {
            let bytes = bytesOfInt(value);
            buffer[offset++] = 0x10 + (bytes - 1) * 2 + (value < 0 ? 1 : 0);
            offset += writeInt(value, buffer, offset);
        }
        else {
            buffer[offset++] = 0x08;
            offset += writeFloat64(value, buffer, offset);
        }
        break;
    case 'object':
        if (Array.isArray(value)) {
            buffer[offset++] = 0x02;
            offset += writeVql(value.length, buffer, offset);
            for (let i = 0; i < value.length; i += 1) {
                offset += writeSerialized(value[i], buffer, offset);
            }
        }
        else if (value instanceof Uint8Array) {
            buffer[offset++] = 0x04;
            offset += writeVql(value.byteLength, buffer, offset);
            let view = value;
            for (let i = 0; i < view.length; i += 1) {
                buffer[offset++] = view[i];
            }
        }
        else if (value instanceof ArrayBuffer) {
            buffer[offset++] = 0x04;
            offset += writeVql(value.byteLength, buffer, offset);
            let view = new Uint8Array(value);
            for (let i = 0; i < view.length; i += 1) {
                buffer[offset++] = view[i];
            }
        }
        else if (value instanceof Date) {
            let time = value.getTime();
            buffer[offset++] = time >= 0 ? 0x30 : 0x31;
            offset += writeDate(value, buffer, offset);
        }
        else {
            buffer[offset++] = 0x03;
            let count = 0;
            Object.keys(value).forEach(n => {
                let v = value[n];
                if (v !== undefined && typeof v !== 'symbol') {
                    count += 1;
                }
            });
            offset += writeVql(count, buffer, offset);
            Object.keys(value).sort().forEach(n => {
                let v = value[n];
                if (v !== undefined && typeof v !== 'symbol') {
                    offset += writeUtf8(n, buffer, offset);
                    buffer[offset++] = 0x00;
                    offset += writeSerialized(v, buffer, offset);
                }
            });
        }
    }

    return offset - start;
}

/**********************************************************
 * Deserialization
 **********************************************************/

 export interface ReadResult {
    value: any,
    bytes: number
 }

/**
 * Deserialize an array of bytes.
 * @param {Uint8Array|ArrayBuffer} data Data to deserialize.
 * @returns {ArrayBuffer} deserialized value.
 */
export function deserialize(data: Uint8Array|ArrayBuffer): any {
    let buffer: Uint8Array = (data as any).buffer ? (data as Uint8Array) : new Uint8Array(data, 0);
    return readSerialized(buffer, 0).value;
}

/**
 * Read from bytes of serialized value.
 * @param {number} number Float number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 */
export function readSerialized(buffer: Uint8Array, offset: number): ReadResult {
    let start = offset;
    let value: any;

    let byte = buffer[offset++];
    switch (byte) {
    case 0x00:
        {
            value = null;
        }
        break;
    case 0x01:
        {
            let length = stringLength(buffer, offset);
            value = readUtf8(buffer, offset, offset + length);
            offset += length + 1;
        }
        break;
    case 0x02:
        {
            let result = readVlq(buffer, offset);
            offset += result.bytes;
            if (offset > buffer.length) {
                throw new Error('Data corrupted.');
            }

            let count = result.value;
            let array = new Array<any>(count);

            for (let i = 0; i < count; i += 1) {
                let result = readSerialized(buffer, offset);
                offset += result.bytes;
                array[i] = result.value;
            }

            value = array;
        }
        break;
    case 0x03:
        {
            let result = readVlq(buffer, offset);
            offset += result.bytes;
            if (offset > buffer.length) {
                throw new Error('Data corrupted.');
            }

            let count = result.value;
            let object: any = {};

            for (let i = 0; i < count; i += 1) {
                let length = stringLength(buffer, offset);
                let name = readUtf8(buffer, offset, offset + length);
                offset += length + 1;

                let result = readSerialized(buffer, offset);
                offset += result.bytes;

                object[name] = result.value;
            }

            value = object;
        }
        break;
    case 0x04:
        {
            let result = readVlq(buffer, offset);
            offset += result.bytes;
            if (offset > buffer.length) {
                throw new Error('Data corrupted.');
            }

            let count = result.value;
            let data = new Uint8Array(count);
            for (let i = 0; i < count; i += 1) {
                data[i] = buffer[offset++];
            }

            value = data.buffer;
        }
        break;
    case 0x05:
        value = true;
        break;
    case 0x06:
        value = false;
        break;
    case 0x07:
        value = readFloat32(buffer, offset);
        offset += 4;
        break;
    case 0x08:
        value = readFloat64(buffer, offset);
        offset += 8;
        break;
    case 0x09:
        throw new Error('128-bit Float is not supported');
    case 0x30:
    case 0x31:
        value = readDate(buffer, offset, byte == 0x31);
        offset += 6;
        break;
    default:
        if (byte >= 0x10 && byte <= 0x2F) {
            if (byte <= 0x1E) {
                let length = Math.floor((byte - 0x10) / 2) + 1;
                value = readInt(buffer, offset, length, !!(byte & 0x01));
                offset += length;
            }
            else {
                throw new Error('Only integer with up to 53 bits is supported');
            }
        }
        else {
            throw new Error('Unrecognized Flag '+byte.toString());
        }
    }
    return {
        value: value,
        bytes: offset - start
    };
}

/**********************************************************
 * Utility
 **********************************************************/

function stringLength(buffer: Uint8Array, offset: number): number {
    let start = offset;
    while (offset < buffer.length) {
        if (!buffer[offset]) {
            return offset - start;
        }
        else {
            offset += 1;
        }
    }
    throw new Error('String is not terminiated with null.');
}

/**
 * Reads bytes as a float32.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} offset Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
export function readFloat32(buffer: Uint8Array, offset: number): number {
    float32Bytes[0] = buffer[offset];
    float32Bytes[1] = buffer[offset+1];
    float32Bytes[2] = buffer[offset+2];
    float32Bytes[3] = buffer[offset+3];
    return float32Out[0];
}

/**
 * Writes an float as bytes.
 * @param {number} number Float number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 */
export function writeFloat32(number: number, buffer: Uint8Array, offset: number): number {
    float32In[0] = number;
    buffer[offset] = float32Bytes[0];
    buffer[offset+1] = float32Bytes[1];
    buffer[offset+2] = float32Bytes[2];
    buffer[offset+3] = float32Bytes[3];
    return 4
}

/**
 * Reads bytes as a float64.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} offset Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
export function readFloat64(buffer: Uint8Array, offset: number): number {
    float64Bytes[0] = buffer[offset];
    float64Bytes[1] = buffer[offset+1];
    float64Bytes[2] = buffer[offset+2];
    float64Bytes[3] = buffer[offset+3];
    float64Bytes[4] = buffer[offset+4];
    float64Bytes[5] = buffer[offset+5];
    float64Bytes[6] = buffer[offset+6];
    float64Bytes[7] = buffer[offset+7];
    return float64Out[0];
}

/**
 * Writes an float as bytes.
 * @param {number} number Float number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 */
export function writeFloat64(number: number, buffer: Uint8Array, offset: number): number {
    float64In[0] = number;
    buffer[offset] = float64Bytes[0];
    buffer[offset+1] = float64Bytes[1];
    buffer[offset+2] = float64Bytes[2];
    buffer[offset+3] = float64Bytes[3];
    buffer[offset+4] = float64Bytes[4];
    buffer[offset+5] = float64Bytes[5];
    buffer[offset+6] = float64Bytes[6];
    buffer[offset+7] = float64Bytes[7];
    return 8;
}

let float32In = new Float32Array(1);
let float32Bytes = new Uint8Array(float32In.buffer, 0);
let float32Out = new Float32Array(float32In.buffer, 0);
let float64In = new Float64Array(1);
let float64Bytes = new Uint8Array(float64In.buffer, 0);
let float64Out = new Float64Array(float64In.buffer, 0);

/**
 * Calculates the bytes to store a positive integer.
 * @param {number} number number
 * @returns {number} Byte length
 */
export function bytesOfInt(number: number): number {
    number = Math.floor(Math.abs(number));
    if (number <= 0xFF) {
        return 1;
    }
    else if (number <= 0xFFFF) {
        return 2;
    }
    else if (number <= 0xFFFFFF) {
        return 3;
    }
    else if (number <= 0xFFFFFFFF) {
        return 4;
    }
    else if (number <= 0xFFFFFFFFFF) {
        return 5;
    }
    else if (number <= 0xFFFFFFFFFFFF) {
        return 6;
    }
    else { // number <= 0x1FFFFFFFFFFFFF
        return 7;
    }
}

/**
 * Reads integer from bytes
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
export function readInt(buffer: Uint8Array, start: number, length: number, negative?: boolean): number {
    let value = 0;
    for (let i = length - 1; i >= 0; i -= 1) {
        let byte = buffer[start + i];
        value = (value * 256) + byte;
    }
    return negative ? -value : value;
}

/**
 * Writes an integer as bytes.
 * @param {number} number Positive number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
export function writeInt(number: number, buffer: Uint8Array, offset: number): number {
    number = Math.floor(Math.abs(number));
    let length = bytesOfInt(number);
	for (let i = 0; i < length; i += 1) {
        buffer[offset+i] = number & 0xFF;
        number = Math.floor(number / 256);
    }
    return length;
}

/**
 * Reads  bytes as a Date.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
export function readDate(buffer: Uint8Array, start: number, negative?: boolean): Date {
    let time = readInt(buffer, start, 6, negative);
    return new Date(time);
}

/**
 * Writes a date as bytes.
 * @param {Date} date Date Time
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
export function writeDate(date: Date, buffer: Uint8Array, offset: number): number {
    let number = Math.abs(date.getTime());
	for (let i = 0; i < 6; i += 1) {
        buffer[offset+i] = number & 0xFF;
        number = Math.floor(number / 256);
    }
    return 6;
}

/**
 * Calculates the VLQ byte length of positive integer.
 * @param {number} number number
 * @returns {number} Byte length
 */
export function bytesOfVql(number: number): number {
    number = Math.floor(Math.abs(number));
    number = Math.floor(number/128);
    let count = 1;
    while (number) {
        number = Math.floor(number/128);
        count += 1;
    }
    return count;
}

/**
 * Reads VLQ bytes as a intenter.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {ReadResult} an integer and bytes eaten.
 */
export function readVlq(buffer: Uint8Array, start: number): ReadResult {
    let value = 0;
    let offset = start;
    let byte: number;
    do {
        byte = buffer[offset];
        offset += 1;
        value = (value * 128) + (byte & 0x7F);
    } while (byte & 0x80);

    return { value: value, bytes: offset - start };
}

/**
 * Writes an integer as VLQ bytes.
 * @param {number} number Positive number
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
export function writeVql(number: number, buffer: Uint8Array, offset: number): number {
    number = Math.floor(Math.abs(number));
    let end = bytesOfVql(number) - 1;
	for (let i = 0; i <= end; i += 1) {
        buffer[offset+i] = (Math.floor(number / vqlDev[end - i]) % 128) + 128;
    }
	buffer[offset+end] ^= 128;
    return end + 1;
}
const vqlDev = [
    0x1,
    0x80,            // 2 ^ (1 * 7)
    0x4000,          // 2 ^ (2 * 7)
    0x200000,        // 2 ^ (3 * 7)
    0x10000000,      // 2 ^ (4 * 7)
    0x800000000,     // 2 ^ (5 * 7)
    0x40000000000,   // 2 ^ (6 * 7)
    0x2000000000000, // 2 ^ (7 * 7)
];

/**
 * Calculates the UTF8 byte length of a string.
 * @param {string} string String
 * @returns {number} Byte length
 */
export function bytesOfUtf8(string: string): number {
    var len = 0,
        c = 0;
    for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128) {
            len += 1;
        }
        else if (c < 2048) {
            len += 2;
        }
        else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
            ++i;
            len += 4;
        }
        else {
            len += 3;
        }
    }
    return len;
}

/**
 * Reads UTF8 bytes as a string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
export function readUtf8(buffer: Uint8Array, start: number, end: number): string {
    var len = end - start;
    if (len < 1)
        return '';
    var parts: string[] = null,
        chunk = [],
        i = 0, // char offset
        t;     // temporary
    while (start < end) {
        t = buffer[start++];
        if (t < 128) {
            chunk[i++] = t;
        }
        else if (t > 191 && t < 224) {
            chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;
        }
        else if (t > 239 && t < 365) {
            t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 0x10000;
            chunk[i++] = 0xD800 + (t >> 10);
            chunk[i++] = 0xDC00 + (t & 1023);
        }
        else {
            chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
        }
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
}

/**
 * Writes a string as UTF8 bytes.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
export function writeUtf8(string: string, buffer: Uint8Array, offset: number): number {
    var start = offset,
        c1, // character 1
        c2; // character 2
    for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
            buffer[offset++] = c1;
        }
        else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6       | 192;
            buffer[offset++] = c1       & 63 | 128;
        }
        else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
            c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
            ++i;
            buffer[offset++] = c1 >> 18      | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        }
        else {
            buffer[offset++] = c1 >> 12      | 224;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        }
    }
    return offset - start;
}
