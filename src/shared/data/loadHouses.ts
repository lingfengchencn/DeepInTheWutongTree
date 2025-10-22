import type { HouseDataset } from '../types';
import wukang from '@data/houses/wukang-building.json';
import gaolan from '@data/houses/gaolan-road-9.json';
import yongfu from '@data/houses/yongfu-road-200.json';

export const loadHouseDataset = (): HouseDataset => {
  return {
    houses: [wukang, gaolan, yongfu]
  };
};
