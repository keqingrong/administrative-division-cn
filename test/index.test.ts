import {
  parseADCode,
  isProvince,
  isPrefecture,
  isCounty,
  formatGB2260Standard,
  formatGB2260WellFormed
} from '../src';
import { dataOf202011 } from '../src/gb2260';

test('parseADCode', () => {
  expect(parseADCode('320102')).toEqual({
    code: '320102',
    provinceCode: '32',
    prefectureCode: '01',
    countyCode: '02'
  });

  expect(parseADCode('320102003002')).toEqual({
    code: '320102',
    provinceCode: '32',
    prefectureCode: '01',
    countyCode: '02'
  });

  expect(parseADCode('32010')).toEqual({
    code: undefined,
    provinceCode: undefined,
    prefectureCode: undefined,
    countyCode: undefined
  });
});

test('isProvince', () => {
  expect(isProvince('110000')).toBeTruthy();
  expect(isProvince('110101')).toBeFalsy();
  expect(isProvince('130100')).toBeFalsy();
});

test('isPrefecture', () => {
  expect(isPrefecture('110000')).toBeFalsy();
  expect(isPrefecture('110101')).toBeFalsy();
  expect(isPrefecture('130100')).toBeTruthy();
});

test('isCounty', () => {
  expect(isCounty('110000')).toBeFalsy();
  expect(isCounty('110101')).toBeTruthy();
  expect(isCounty('130100')).toBeFalsy();
});

test('formatGB2260Standard', () => {
  const formatted = formatGB2260Standard(dataOf202011);
  const dataOf110000 = formatted.find(item => item.code === '110000');
  const dataOf110101 = dataOf110000?.children?.find(
    item => item.code === '110101'
  );

  expect({
    ...dataOf110000,
    children: []
  }).toEqual({
    code: '110000',
    name: '北京市',
    provinceCode: '11',
    prefectureCode: '00',
    countyCode: '00',
    type: 'province',
    children: []
  });

  expect(dataOf110101).toEqual({
    code: '110101',
    name: '东城区',
    provinceCode: '11',
    prefectureCode: '01',
    countyCode: '01',
    type: 'county'
  });
});

test('formatGB2260WellFormed', () => {
  const formatted = formatGB2260WellFormed(dataOf202011);
  const dataOf110000 = formatted.find(item => item.code === '110000');
  const dataOf110100 = dataOf110000?.children?.find(
    item => item.code === '110100'
  );
  const dataOf110101 = dataOf110100?.children?.find(
    item => item.code === '110101'
  );

  expect({
    ...dataOf110000,
    children: []
  }).toEqual({
    code: '110000',
    name: '北京市',
    provinceCode: '11',
    prefectureCode: '00',
    countyCode: '00',
    type: 'province',
    children: []
  });

  expect({
    ...dataOf110100,
    children: []
  }).toEqual({
    code: '110100',
    name: '市辖区',
    provinceCode: '11',
    prefectureCode: '01',
    countyCode: '00',
    type: 'prefecture',
    children: []
  });

  expect(dataOf110101).toEqual({
    code: '110101',
    name: '东城区',
    provinceCode: '11',
    prefectureCode: '01',
    countyCode: '01',
    type: 'county'
  });
});
