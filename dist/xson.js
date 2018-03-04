/**********************************************************
 * Serialization
 **********************************************************/
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Serialize an value to array of bytes.
     * @param {any} value Value to serialize.
     * @returns {ArrayBuffer} bytes array.
     */
    function serialize(value) {
        var bytes = bytesOfSerialized(value);
        var buffer = new Uint8Array(bytes);
        writeSerialized(value, buffer, 0);
        return buffer.buffer;
    }
    exports.serialize = serialize;
    /**
     * Calculates the bytes of serialized value.
     * @param {any} value Value to serialize.
     * @returns {number} Byte count.
     */
    function bytesOfSerialized(value) {
        if (value === undefined ||
            value === null ||
            value === true ||
            value === false) {
            return 1;
        }
        switch (typeof value) {
            case 'string':
                return 1 + bytesOfUtf8(value) + 1;
            case 'number':
                if (isNaN(value)) {
                    return 1;
                }
                return 1 + (value === Math.floor(value) ? bytesOfInt(value) : 8);
            case 'object':
                if (Array.isArray(value)) {
                    var bytes = 1 + bytesOfVql(value.length);
                    for (var i = 0; i < value.length; i += 1) {
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
                    var bytes_1 = 1;
                    var count_1 = 0;
                    Object.keys(value).forEach(function (n) {
                        var v = value[n];
                        if (v !== undefined && typeof v !== 'symbol') {
                            count_1 += 1;
                            bytes_1 += bytesOfUtf8(n);
                            bytes_1 += 1;
                            bytes_1 += bytesOfSerialized(v);
                        }
                    });
                    bytes_1 += bytesOfVql(count_1);
                    return bytes_1;
                }
        }
    }
    exports.bytesOfSerialized = bytesOfSerialized;
    /**
     * Writes bytes of serialized value.
     * @param {number} number Float number
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     */
    function writeSerialized(value, buffer, offset) {
        if (value === undefined ||
            value === null) {
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
        var start = offset;
        switch (typeof value) {
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
                    var bytes = bytesOfInt(value);
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
                    for (var i = 0; i < value.length; i += 1) {
                        offset += writeSerialized(value[i], buffer, offset);
                    }
                }
                else if (value instanceof Uint8Array) {
                    buffer[offset++] = 0x04;
                    offset += writeVql(value.byteLength, buffer, offset);
                    var view = value;
                    for (var i = 0; i < view.length; i += 1) {
                        buffer[offset++] = view[i];
                    }
                }
                else if (value instanceof ArrayBuffer) {
                    buffer[offset++] = 0x04;
                    offset += writeVql(value.byteLength, buffer, offset);
                    var view = new Uint8Array(value);
                    for (var i = 0; i < view.length; i += 1) {
                        buffer[offset++] = view[i];
                    }
                }
                else if (value instanceof Date) {
                    var time = value.getTime();
                    buffer[offset++] = time >= 0 ? 0x30 : 0x31;
                    offset += writeDate(value, buffer, offset);
                }
                else {
                    buffer[offset++] = 0x03;
                    var count_2 = 0;
                    Object.keys(value).forEach(function (n) {
                        var v = value[n];
                        if (v !== undefined && typeof v !== 'symbol') {
                            count_2 += 1;
                        }
                    });
                    offset += writeVql(count_2, buffer, offset);
                    Object.keys(value).sort().forEach(function (n) {
                        var v = value[n];
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
    exports.writeSerialized = writeSerialized;
    /**
     * Deserialize an array of bytes.
     * @param {Uint8Array|ArrayBuffer} data Data to deserialize.
     * @returns {ArrayBuffer} deserialized value.
     */
    function deserialize(data) {
        var buffer = data.buffer ? data : new Uint8Array(data, 0);
        return readSerialized(buffer, 0).value;
    }
    exports.deserialize = deserialize;
    /**
     * Read from bytes of serialized value.
     * @param {number} number Float number
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     */
    function readSerialized(buffer, offset) {
        var start = offset;
        var value;
        var byte = buffer[offset++];
        switch (byte) {
            case 0x00:
                {
                    value = null;
                }
                break;
            case 0x01:
                {
                    var length_1 = stringLength(buffer, offset);
                    value = readUtf8(buffer, offset, offset + length_1);
                    offset += length_1 + 1;
                }
                break;
            case 0x02:
                {
                    var result = readVlq(buffer, offset);
                    offset += result.bytes;
                    if (offset > buffer.length) {
                        throw new Error('Data corrupted.');
                    }
                    var count = result.value;
                    var array = new Array(count);
                    for (var i = 0; i < count; i += 1) {
                        var result_1 = readSerialized(buffer, offset);
                        offset += result_1.bytes;
                        array[i] = result_1.value;
                    }
                    value = array;
                }
                break;
            case 0x03:
                {
                    var result = readVlq(buffer, offset);
                    offset += result.bytes;
                    if (offset > buffer.length) {
                        throw new Error('Data corrupted.');
                    }
                    var count = result.value;
                    var object = {};
                    for (var i = 0; i < count; i += 1) {
                        var length_2 = stringLength(buffer, offset);
                        var name_1 = readUtf8(buffer, offset, offset + length_2);
                        offset += length_2 + 1;
                        var result_2 = readSerialized(buffer, offset);
                        offset += result_2.bytes;
                        object[name_1] = result_2.value;
                    }
                    value = object;
                }
                break;
            case 0x04:
                {
                    var result = readVlq(buffer, offset);
                    offset += result.bytes;
                    if (offset > buffer.length) {
                        throw new Error('Data corrupted.');
                    }
                    var count = result.value;
                    var data = new Uint8Array(count);
                    for (var i = 0; i < count; i += 1) {
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
                        var length_3 = Math.floor((byte - 0x10) / 2) + 1;
                        value = readInt(buffer, offset, length_3, !!(byte & 0x01));
                        offset += length_3;
                    }
                    else {
                        throw new Error('Only integer with up to 53 bits is supported');
                    }
                }
                else {
                    throw new Error('Unrecognized Flag ' + byte.toString());
                }
        }
        return {
            value: value,
            bytes: offset - start
        };
    }
    exports.readSerialized = readSerialized;
    /**********************************************************
     * Utility
     **********************************************************/
    function stringLength(buffer, offset) {
        var start = offset;
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
    function readFloat32(buffer, offset) {
        float32Bytes[0] = buffer[offset];
        float32Bytes[1] = buffer[offset + 1];
        float32Bytes[2] = buffer[offset + 2];
        float32Bytes[3] = buffer[offset + 3];
        return float32Out[0];
    }
    exports.readFloat32 = readFloat32;
    /**
     * Writes an float as bytes.
     * @param {number} number Float number
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     */
    function writeFloat32(number, buffer, offset) {
        float32In[0] = number;
        buffer[offset] = float32Bytes[0];
        buffer[offset + 1] = float32Bytes[1];
        buffer[offset + 2] = float32Bytes[2];
        buffer[offset + 3] = float32Bytes[3];
        return 4;
    }
    exports.writeFloat32 = writeFloat32;
    /**
     * Reads bytes as a float64.
     * @param {Uint8Array} buffer Source buffer
     * @param {number} offset Source start
     * @param {number} end Source end
     * @returns {string} String read
     */
    function readFloat64(buffer, offset) {
        float64Bytes[0] = buffer[offset];
        float64Bytes[1] = buffer[offset + 1];
        float64Bytes[2] = buffer[offset + 2];
        float64Bytes[3] = buffer[offset + 3];
        float64Bytes[4] = buffer[offset + 4];
        float64Bytes[5] = buffer[offset + 5];
        float64Bytes[6] = buffer[offset + 6];
        float64Bytes[7] = buffer[offset + 7];
        return float64Out[0];
    }
    exports.readFloat64 = readFloat64;
    /**
     * Writes an float as bytes.
     * @param {number} number Float number
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     */
    function writeFloat64(number, buffer, offset) {
        float64In[0] = number;
        buffer[offset] = float64Bytes[0];
        buffer[offset + 1] = float64Bytes[1];
        buffer[offset + 2] = float64Bytes[2];
        buffer[offset + 3] = float64Bytes[3];
        buffer[offset + 4] = float64Bytes[4];
        buffer[offset + 5] = float64Bytes[5];
        buffer[offset + 6] = float64Bytes[6];
        buffer[offset + 7] = float64Bytes[7];
        return 8;
    }
    exports.writeFloat64 = writeFloat64;
    var float32In = new Float32Array(1);
    var float32Bytes = new Uint8Array(float32In.buffer, 0);
    var float32Out = new Float32Array(float32In.buffer, 0);
    var float64In = new Float64Array(1);
    var float64Bytes = new Uint8Array(float64In.buffer, 0);
    var float64Out = new Float64Array(float64In.buffer, 0);
    /**
     * Calculates the bytes to store a positive integer.
     * @param {number} number number
     * @returns {number} Byte length
     */
    function bytesOfInt(number) {
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
        else {
            return 7;
        }
    }
    exports.bytesOfInt = bytesOfInt;
    /**
     * Reads integer from bytes
     * @param {Uint8Array} buffer Source buffer
     * @param {number} start Source start
     * @param {number} end Source end
     * @returns {string} String read
     */
    function readInt(buffer, start, length, negative) {
        var value = 0;
        for (var i = length - 1; i >= 0; i -= 1) {
            var byte = buffer[start + i];
            value = (value * 256) + byte;
        }
        return negative ? -value : value;
    }
    exports.readInt = readInt;
    /**
     * Writes an integer as bytes.
     * @param {number} number Positive number
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     * @returns {number} Bytes written
     */
    function writeInt(number, buffer, offset) {
        number = Math.floor(Math.abs(number));
        var length = bytesOfInt(number);
        for (var i = 0; i < length; i += 1) {
            buffer[offset + i] = number & 0xFF;
            number = Math.floor(number / 256);
        }
        return length;
    }
    exports.writeInt = writeInt;
    /**
     * Reads  bytes as a Date.
     * @param {Uint8Array} buffer Source buffer
     * @param {number} start Source start
     * @param {number} end Source end
     * @returns {string} String read
     */
    function readDate(buffer, start, negative) {
        var time = readInt(buffer, start, 6, negative);
        return new Date(time);
    }
    exports.readDate = readDate;
    /**
     * Writes a date as bytes.
     * @param {Date} date Date Time
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     * @returns {number} Bytes written
     */
    function writeDate(date, buffer, offset) {
        var number = Math.abs(date.getTime());
        for (var i = 0; i < 6; i += 1) {
            buffer[offset + i] = number & 0xFF;
            number = Math.floor(number / 256);
        }
        return 6;
    }
    exports.writeDate = writeDate;
    /**
     * Calculates the VLQ byte length of positive integer.
     * @param {number} number number
     * @returns {number} Byte length
     */
    function bytesOfVql(number) {
        number = Math.floor(Math.abs(number));
        number = Math.floor(number / 128);
        var count = 1;
        while (number) {
            number = Math.floor(number / 128);
            count += 1;
        }
        return count;
    }
    exports.bytesOfVql = bytesOfVql;
    /**
     * Reads VLQ bytes as a intenter.
     * @param {Uint8Array} buffer Source buffer
     * @param {number} start Source start
     * @param {number} end Source end
     * @returns {ReadResult} an integer and bytes eaten.
     */
    function readVlq(buffer, start) {
        var value = 0;
        var offset = start;
        var byte;
        do {
            byte = buffer[offset];
            offset += 1;
            value = (value * 128) + (byte & 0x7F);
        } while (byte & 0x80);
        return { value: value, bytes: offset - start };
    }
    exports.readVlq = readVlq;
    /**
     * Writes an integer as VLQ bytes.
     * @param {number} number Positive number
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     * @returns {number} Bytes written
     */
    function writeVql(number, buffer, offset) {
        number = Math.floor(Math.abs(number));
        var end = bytesOfVql(number) - 1;
        for (var i = 0; i <= end; i += 1) {
            buffer[offset + i] = (Math.floor(number / vqlDev[end - i]) % 128) + 128;
        }
        buffer[offset + end] ^= 128;
        return end + 1;
    }
    exports.writeVql = writeVql;
    var vqlDev = [
        0x1,
        0x80,
        0x4000,
        0x200000,
        0x10000000,
        0x800000000,
        0x40000000000,
        0x2000000000000,
    ];
    /**
     * Calculates the UTF8 byte length of a string.
     * @param {string} string String
     * @returns {number} Byte length
     */
    function bytesOfUtf8(string) {
        var len = 0, c = 0;
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
    exports.bytesOfUtf8 = bytesOfUtf8;
    /**
     * Reads UTF8 bytes as a string.
     * @param {Uint8Array} buffer Source buffer
     * @param {number} start Source start
     * @param {number} end Source end
     * @returns {string} String read
     */
    function readUtf8(buffer, start, end) {
        var len = end - start;
        if (len < 1)
            return '';
        var parts = null, chunk = [], i = 0, // char offset
        t; // temporary
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
    exports.readUtf8 = readUtf8;
    /**
     * Writes a string as UTF8 bytes.
     * @param {string} string Source string
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     * @returns {number} Bytes written
     */
    function writeUtf8(string, buffer, offset) {
        var start = offset, c1, // character 1
        c2; // character 2
        for (var i = 0; i < string.length; ++i) {
            c1 = string.charCodeAt(i);
            if (c1 < 128) {
                buffer[offset++] = c1;
            }
            else if (c1 < 2048) {
                buffer[offset++] = c1 >> 6 | 192;
                buffer[offset++] = c1 & 63 | 128;
            }
            else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
                c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
                ++i;
                buffer[offset++] = c1 >> 18 | 240;
                buffer[offset++] = c1 >> 12 & 63 | 128;
                buffer[offset++] = c1 >> 6 & 63 | 128;
                buffer[offset++] = c1 & 63 | 128;
            }
            else {
                buffer[offset++] = c1 >> 12 | 224;
                buffer[offset++] = c1 >> 6 & 63 | 128;
                buffer[offset++] = c1 & 63 | 128;
            }
        }
        return offset - start;
    }
    exports.writeUtf8 = writeUtf8;
});
