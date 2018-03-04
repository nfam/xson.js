import { serialize, deserialize, readDate, bytesOfVql, writeVql, readVlq } from '../src/xson';
import { expect } from 'chai';


describe('XSON', () => {
    describe('#utility', () => {
        it('vql', () => {
            let number = 61440;
            let length = bytesOfVql(number);
            expect(length).eq(3);
            let buffer = new Uint8Array(length);
            writeVql(number, buffer, 0);
            let x = readVlq(buffer, 0);
            expect(x.value).eql(number);
        });
    });
    describe('#serialize', () => {
        it('should successfully serialize undefined', () => {
            let buffer = serialize(undefined);
            let bytes = new Uint8Array(buffer, );
            expect(buffer.byteLength).equals(1);
            expect(bytes[0]).equals(0);
        });
        it('should successfully serialize null', () => {
            let buffer = serialize(null);
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(1);
            expect(bytes[0]).equals(0);
        });
        it('should successfully serialize NaN', () => {
            let buffer = serialize(NaN);
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(1);
            expect(bytes[0]).equals(0);
        });
        it('should successfully serialize string', () => {
            let buffer = serialize('0123');
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(6);
            expect(bytes[0]).equals(0x01);
            expect(bytes[1]).equals(0x30);
            expect(bytes[5]).equals(0);
        });
        it('should successfully serialize emtpy array', () => {
            let buffer = serialize([]);
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(2);
            expect(bytes[0]).equals(0x02);
            expect(bytes[1]).equals(0);
        });
        it('should successfully serialize array of string', () => {
            let buffer = serialize(['0123']);
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(8);
            expect(bytes[0]).equals(0x02);
            expect(bytes[1]).equals(1);
            expect(bytes[2]).equals(0x01);
            expect(bytes[3]).equals(0x30);
            expect(bytes[7]).equals(0);
        });
        it('should successfully serialize array having undfined', () => {
            let buffer = serialize([undefined, '0123', null]);
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(10);
            expect(bytes[0]).equals(0x02);
            expect(bytes[1]).equals(3);
            expect(bytes[2]).equals(0x00);
            expect(bytes[3]).equals(0x01);
            expect(bytes[4]).equals(0x30);
            expect(bytes[8]).equals(0);
            expect(bytes[9]).equals(0);
        });
        it('should successfully serialize emtpy object', () => {
            let buffer = serialize({});
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(2);
            expect(bytes[0]).equals(0x03);
            expect(bytes[1]).equals(0);
        });
        it('should successfully serialize simple object', () => {
            let buffer = serialize({A:'2'});
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(7);
            expect(bytes[0]).equals(0x03);
            expect(bytes[1]).equals(1);
            expect(bytes[2]).equals(65);
            expect(bytes[3]).equals(0);
            expect(bytes[4]).equals(1);
            expect(bytes[5]).equals(50);
            expect(bytes[6]).equals(0);
        });
        it('should successfully serialize object', () => {
            let buffer = serialize({A:'2', B:true, C:3});
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(14);
            expect(bytes[0]).equals(0x03);
        });
        it('should successfully serialize object having undefined', () => {
            let buffer = serialize({A:'2', B: undefined, C: null});
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(10);
            expect(bytes[0]).equals(0x03);
            expect(bytes[1]).equals(2);
            expect(bytes[2]).equals(65);
            expect(bytes[3]).equals(0);
            expect(bytes[4]).equals(1);
            expect(bytes[5]).equals(50);
            expect(bytes[6]).equals(0);
            expect(bytes[7]).equals(67);
            expect(bytes[8]).equals(0);
            expect(bytes[9]).equals(0);
        });
        it('should successfully serialize object with order', () => {
            let buffer1 = serialize({A:'2', B: '3'});
            let bytes1 = new Uint8Array(buffer1, 0);
            let buffer2 = serialize({B:'3', A: '2'});
            let bytes2 = new Uint8Array(buffer2, 0);

            expect(bytes1).to.deep.equal(bytes2);
        });
        it('should successfully serialize binary', () => {
            let bytes1 = new Uint8Array(3);
            bytes1[0] = 223;
            bytes1[1] = 224;
            bytes1[2] = 225;
            let buffer2 = serialize(bytes1);
            let bytes2 = new Uint8Array(buffer2, 0);
            let buffer3 = serialize(bytes1);
            let bytes3 = new Uint8Array(buffer3, 0);

            expect(buffer2.byteLength).equal(5);
            expect(bytes2[0]).equal(4);
            expect(bytes2[1]).equal(3);
            expect(bytes2[2]).equal(223);
            expect(bytes2[3]).equal(224);
            expect(bytes2[4]).equal(225);
            expect(bytes2).to.deep.equal(bytes3);
        });
        it('should successfully serialize long binary for VQL', () => {
            let bytes1 = new Uint8Array(128);
            for (let i = 0; i < 128; i += 1) {
                bytes1[i] = i;
            }
            let buffer2 = serialize(bytes1.buffer);
            let bytes2 = new Uint8Array(buffer2, 0);

            expect(buffer2.byteLength).equal(131);
            expect(bytes2[0]).equal(4);
            expect(bytes2[1]).equal(129);
            expect(bytes2[2]).equal(0);
            expect(bytes2[3]).equal(0);
            expect(bytes2[4]).equal(1);
            expect(bytes2[5]).equal(2);
            expect(bytes2[130]).equal(127);
        });
        it('should successfully serialize true', () => {
            let buffer = serialize(true);
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(1);
            expect(bytes[0]).equals(5);
        });
        it('should successfully serialize false', () => {
            let buffer = serialize(false);
            let bytes = new Uint8Array(buffer, 0);
            expect(buffer.byteLength).equals(1);
            expect(bytes[0]).equals(6);
        });
        it('should successfully serialize number', () => {
            {
                let buffer = serialize(5);
                let bytes = new Uint8Array(buffer, 0);
                expect(buffer.byteLength).equals(2);
                expect(bytes[0]).equals(0x10);
                expect(bytes[1]).equals(5);
            }
            {
                let buffer = serialize(-5);
                let bytes = new Uint8Array(buffer, 0);
                expect(buffer.byteLength).equals(2);
                expect(bytes[0]).equals(0x11);
                expect(bytes[1]).equals(5);
            }
            {
                let buffer = serialize(1+0xFF);
                let bytes = new Uint8Array(buffer, 0);
                expect(buffer.byteLength).equals(3);
                expect(bytes[0]).equals(0x12);
                expect(bytes[1]).equals(0);
                expect(bytes[2]).equals(1);
            }
            {
                let buffer = serialize(1+0xFFFF);
                let bytes = new Uint8Array(buffer, 0);
                expect(buffer.byteLength).equals(4);
                expect(bytes[0]).equals(0x14);
                expect(bytes[1]).equals(0);
                expect(bytes[2]).equals(0);
                expect(bytes[3]).equals(1);
            }
            {
                let buffer = serialize(1+0xFFFFFF);
                let bytes = new Uint8Array(buffer, 0);
                expect(buffer.byteLength).equals(5);
                expect(bytes[0]).equals(0x16);
                expect(bytes[1]).equals(0);
                expect(bytes[2]).equals(0);
                expect(bytes[3]).equals(0);
                expect(bytes[4]).equals(1);
            }
            {
                let buffer = serialize(1+0xFFFFFFFF);
                let bytes = new Uint8Array(buffer, 0);
                expect(buffer.byteLength).equals(6);
                expect(bytes[0]).equals(0x18);
                expect(bytes[1]).equals(0);
                expect(bytes[2]).equals(0);
                expect(bytes[3]).equals(0);
                expect(bytes[4]).equals(0);
                expect(bytes[5]).equals(1);
            }
            {
                let buffer = serialize(1+0xFFFFFFFFFF);
                let bytes = new Uint8Array(buffer, 0);
                expect(buffer.byteLength).equals(7);
                expect(bytes[0]).equals(0x1A);
                expect(bytes[1]).equals(0);
                expect(bytes[2]).equals(0);
                expect(bytes[3]).equals(0);
                expect(bytes[4]).equals(0);
                expect(bytes[5]).equals(0);
                expect(bytes[6]).equals(1);
            }
            {
                let buffer = serialize(1+0xFFFFFFFFFFFF);
                let bytes = new Uint8Array(buffer, 0);
                expect(buffer.byteLength).equals(8);
                expect(bytes[0]).equals(0x1C);
                expect(bytes[1]).equals(0);
                expect(bytes[2]).equals(0);
                expect(bytes[3]).equals(0);
                expect(bytes[4]).equals(0);
                expect(bytes[5]).equals(0);
                expect(bytes[6]).equals(0);
                expect(bytes[7]).equals(1);
            }
        });
        it('should successfully serialize float64', () => {
            let buffer = serialize(3.2);
            let bytes = new Uint8Array(buffer, 0);
            let float64 = new Float64Array(buffer.slice(1), 0);
            expect(buffer.byteLength).equals(9);
            expect(bytes[0]).equals(8);
            expect(float64[0]).equals(3.2);
        });
        it('should successfully serialize datetime', () => {
            {
                let now = new Date();
                let buffer = serialize(now);
                let bytes = new Uint8Array(buffer, 0);

                expect(buffer.byteLength).equals(7);
                expect(bytes[0]).equals(0x30);

                let date = readDate(bytes, 1);
                expect(date.getTime()).equals(now.getTime());
            }
            {
                let now = new Date('1960-01-01');
                let buffer = serialize(now);
                let bytes = new Uint8Array(buffer, 0);

                expect(buffer.byteLength).equals(7);
                expect(bytes[0]).equals(0x31);

                let date = readDate(bytes, 1, true);
                expect(date.getTime()).equals(now.getTime());
            }
        });
    })
    describe('#deserialize', () => {
        it('should successfully deserialize JSON data type correctly', () => {
            let object = {
                null: null,
                string: 'string',
                array: ['1', 2],
                object: { o: 1 },
                true: true,
                false: false,
                float: 3.5,
                int1: 1,
                int2: 1+0xFF,
                int3: 1+0xFFFF,
                int4: 1+0xFFFFFF,
                int5: 1+0xFFFFFFFF,
                int6: 1+0xFFFFFFFFFF,
                int7: 1+0xFFFFFFFFFFFF
            };

            let buffer = serialize(object);
            let object1 = deserialize(buffer);
            expect(object1).to.deep.eq(object);
        });
        it('should successfully deserialize Binary correctly', () => {
            let bytes1 = new Uint8Array(3);
            bytes1[0] = 223;
            bytes1[1] = 224;
            bytes1[2] = 225;
            let buffer2 = serialize(bytes1);
            let bytes2 = new Uint8Array(buffer2, 0);
            let buffer3 = deserialize(bytes2);
            expect(buffer3.byteLength).equal(3);
            let byte3 = new Uint8Array(buffer3)
            expect(byte3[0]).equal(223);
            expect(byte3[1]).equal(224);
            expect(byte3[2]).equal(225);
        });
        it('should successfully deserialize datetime', () => {
            {
                let now = new Date();
                let buffer = serialize(now);
                let date = deserialize(buffer);
                expect(date.getTime()).equals(now.getTime());
            }
            {
                let now = new Date('1960-01-01');
                let buffer = serialize(now);
                let date = deserialize(buffer);
                expect(date.getTime()).equals(now.getTime());
            }
        });
    });
});