
# XSON [![npm][npm-badge]][npm-url] ![license][license-badge]
> eXtended binary Serialized Object Notation

|          | **Status**                                     |
|---       |:---:                                           |
| Linux    | [![travis][travis-badge]][travis-url]          |
| Windows  | [![appveyor][appveyor-badge]][appveyor-url]    |
| Coverage | [![codecov][codecov-badge]][codecov-url]       |

# Binary Format
~~~~

(Little Endian Order)

value               null | string | array | object | true | false | integer | float | decimal | datetime | extended

null                0x00
string              0x01    cstring
array               0x02    count (value*)
object              0x03    count (pair*)
binary              0x04    size (byte*)
true                0x05
false               0x06
float               0x07    4 bytes (32-bit IEEE 754-2008 binary floating point)
                    0x08    8 bytes (64-bit IEEE 754-2008 binary floating point)
                    0x09    16 bytes (128-bit IEEE 754-2008 decimal floating point)

integer             0x10    byte    (positive 8-bit integer)
                    0x11    byte    (negative 8-bit integer)
                    0x12    2 bytes (positive 16-bit integer)
                    0x13    2 bytes (negative 16-bit integer)
                    0x14    3 bytes (positive 24-bit integer)
                    0x15    3 bytes (negative 24-bit integer)
                    0x16    4 bytes (positive 32-bit integer)
                    0x17    4 bytes (negative 32-bit integer)
                    0x18    5 bytes (positive 40-bit integer)
                    0x19    5 bytes (negative 40-bit integer)
                    0x1A    6 bytes (positive 48-bit integer)
                    0x1B    6 bytes (negative 48-bit integer)
                    0x1C    7 bytes (positive 56-bit integer)
                    0x1D    7 bytes (negative 56-bit integer)
                    0x1E    8 bytes (positive 64-bit integer)
                    0x1F    8 bytes (negative 64-bit integer)
                    .
                    .
                    .
                    0x2E    16 bytes (positive 128-bit integer)
                    0x2F    16 bytes (negative 128-bit integer)
datetime            0x30    byte byte byte byte byte byte  (milliseconds since 1970-01-01)
                    0x31    byte byte byte byte byte byte  (milliseconds since 1970-01-01, negative)

extended            0xFF    strdata size bytes

count               vlq
cstring             bytes '\x00'    (utf8 bytes terminated by zero)
pair                cstring value
size                vlq
vlq                 bytes           (Variable-length quantity aka. encoded integer)
~~~~

For reading and writing integer.
~~~JavaScript
isInteger            = (flag >= 0x10 && flag <= 0x2F) // 128-bit processor not now
                     = (flag >= 0x10 && flag <= 0x1F) // 64-bit processor C, C#, Swift
                     = (flag >= 0x10 && flag <= 0x1E) // Javascript
isIntegerNegative    = (flag & 0x01)
bytesOfInteger       = Math.floor((flag - 0x10) / 2) + 1;

flag = 0x10 + (bytes - 1) * 2 + (negative ? 1 : 0);
~~~

[npm-badge]: https://img.shields.io/npm/v/xson.js.svg
[npm-url]: https://www.npmjs.com/package/xson.js

[travis-badge]: https://travis-ci.org/nfam/xson.js.svg
[travis-url]: https://travis-ci.org/nfam/xson.js

[appveyor-badge]: https://ci.appveyor.com/api/projects/status/github/nfam/xson.js?svg=true
[appveyor-url]: https://ci.appveyor.com/project/nfam/xson/

[codecov-badge]: https://codecov.io/gh/nfam/xson.js/branch/master/graphs/badge.svg
[codecov-url]: https://codecov.io/gh/nfam/xson.js/branch/master

[license-badge]: https://img.shields.io/github/license/nfam/xson.js.svg
