import { ADDataItem } from './gb2260/types';
export { dataOf202011 } from './gb2260';

/**
 * 默认地级行政单位区划代码
 */
export const defaultPrefectureObject: { [code: string]: string } = {
  '110100': '市辖区', // 北京市
  '120100': '市辖区', // 天津市
  '310100': '市辖区', // 上海市
  '419000': '省直辖县级行政区划', // 河南省
  '429000': '省直辖县级行政区划', // 湖北省
  '469000': '省直辖县级行政区划', // 海南省
  '500100': '市辖区', // 重庆市
  '500200': '县', // 重庆市
  '659000': '自治区直辖县级行政区划' // 新疆维吾尔自治区
};

export interface ADCodeParsed {
  /** 完整区划代码 */
  code: string;
  /** 省级行政单位区划代码 */
  provinceCode: string;
  /** 地级行政单位区划代码 */
  prefectureCode: string;
  /** 县级行政单位区划代码 */
  countyCode: string;
}

export interface ADCodeNode extends ADCodeParsed, ADDataItem {
  /** 行政单位类型 */
  type: 'province' | 'prefecture' | 'county';
  /** 下级行政区 */
  children?: ADCodeNode[];
}

/**
 * 解析6位行政区划代码
 * @param adCode
 */
export const parseADCode = (adCode: string): ADCodeParsed => {
  const [code, provinceCode, prefectureCode, countyCode] =
    /^(\d{2})(\d{2})(\d{2})/.exec(adCode) || [];
  return {
    code,
    provinceCode,
    prefectureCode,
    countyCode
  };
};

/**
 * 判断是否是省级行政单位的区划代码
 * @param adCode
 */
export const isProvince = (adCode: string | ADCodeParsed) => {
  const parsed = typeof adCode === 'string' ? parseADCode(adCode) : adCode;
  return parsed.countyCode === '00' && parsed.prefectureCode === '00';
};

/**
 * 判断是否是地级行政单位的区划代码
 * @param adCode
 */
export const isPrefecture = (adCode: string | ADCodeParsed) => {
  const parsed = typeof adCode === 'string' ? parseADCode(adCode) : adCode;
  return parsed.countyCode === '00' && parsed.prefectureCode !== '00';
};

/**
 * 判断是否是县级行政单位的区划代码
 * @param adCode
 */
export const isCounty = (adCode: string | ADCodeParsed) => {
  const parsed = typeof adCode === 'string' ? parseADCode(adCode) : adCode;
  return parsed.countyCode !== '00';
};

/**
 * 处理 GB2260 数据
 * @param data
 */
export const processGB2260 = (data: ADDataItem[]) => {
  const provinces: ADCodeNode[] = [];
  const prefectures: ADCodeNode[] = [];
  const counties: ADCodeNode[] = [];

  data.forEach(item => {
    const { provinceCode, prefectureCode, countyCode } = parseADCode(item.code);
    if (countyCode === '00') {
      if (prefectureCode === '00') {
        provinces.push({
          ...item,
          provinceCode,
          prefectureCode,
          countyCode,
          type: 'province'
        });
      } else {
        prefectures.push({
          ...item,
          provinceCode,
          prefectureCode,
          countyCode,
          type: 'prefecture'
        });
      }
    } else {
      counties.push({
        ...item,
        provinceCode,
        prefectureCode,
        countyCode,
        type: 'county'
      });
    }
  });

  return {
    provinces,
    prefectures,
    counties
  };
};

/**
 * 格式化 GB2260 数据，不包括汇总代码，【省-市-县】或【省-县】格式
 * @param data
 */
export const formatGB2260Standard = (data: ADDataItem[]) => {
  const { provinces, prefectures, counties } = processGB2260(data);

  const root: { children: ADCodeNode[] } = {
    children: []
  };

  provinces.forEach(province => {
    root.children.push({
      ...province,
      children: []
    });
  });

  prefectures.forEach(prefecture => {
    const prefectureNode = {
      ...prefecture,
      children: []
    };
    const provinceNode = root.children.find(
      item => item.provinceCode === prefecture.provinceCode
    );
    if (provinceNode) {
      provinceNode.children?.push(prefectureNode);
    }
  });

  counties.forEach(county => {
    const provinceNode = root.children.find(
      item => item.provinceCode === county.provinceCode
    );
    if (provinceNode) {
      const prefectureNode = provinceNode.children?.find(
        item => item.prefectureCode === county.prefectureCode
      );

      // 如果不存在相应的地级行政单位，则将县级行政单位添加为地级行政单位子节点
      if (
        typeof prefectureNode === 'undefined' ||
        prefectureNode.type === 'county'
      ) {
        if (!Array.isArray(provinceNode.children)) {
          provinceNode.children = [];
        }
        provinceNode.children.push(county);
      } else {
        prefectureNode.children?.push(county);
      }
    }
  });

  return root.children;
};

/**
 * 格式化 GB2260 数据，包括汇总代码，规范的【省-市-县】格式
 * @param data
 */
export const formatGB2260WellFormed = (data: ADDataItem[]) => {
  const { provinces, prefectures, counties } = processGB2260(data);

  const root: { children: ADCodeNode[] } = {
    children: []
  };

  provinces.forEach(province => {
    root.children.push({
      ...province,
      children: []
    });
  });

  prefectures.forEach(prefecture => {
    const prefectureNode = {
      ...prefecture,
      children: []
    };
    const provinceNode = root.children.find(
      item => item.provinceCode === prefecture.provinceCode
    );
    if (provinceNode) {
      provinceNode.children?.push(prefectureNode);
    }
  });

  counties.forEach(county => {
    const provinceNode = root.children.find(
      item => item.provinceCode === county.provinceCode
    );
    if (provinceNode) {
      let prefectureNode = provinceNode.children?.find(
        item => item.prefectureCode === county.prefectureCode
      );

      // 如果不存在相应的地级行政单位，则手动创建一个
      if (typeof prefectureNode === 'undefined') {
        const code = `${county.provinceCode}${county.prefectureCode}00`;
        const newPrefectureNode: ADCodeNode = {
          code: code,
          name: defaultPrefectureObject[code] || '直辖',
          provinceCode: county.provinceCode,
          prefectureCode: county.prefectureCode,
          countyCode: '00',
          type: 'prefecture',
          children: [county]
        };
        provinceNode.children?.push(newPrefectureNode);
      } else {
        prefectureNode.children?.push(county);
      }
    }
  });

  return root.children;
};
