import type { ScriptStep } from '../types';

export const offlineScript: ScriptStep[] = [
  {
    delay: 1200,
    action: 'announce',
    payload: {
      text: '欢迎来到梧桐深处演示，我们将在 6 分钟内完成一次沉浸式导览。'
    }
  },
  {
    delay: 4200,
    action: 'moveToHouse',
    payload: {
      houseId: 'wukang-building'
    }
  },
  {
    delay: 7200,
    action: 'announce',
    payload: {
      text: '武康大楼是 Art Deco 的地标，我正为你展示围绕镜头与故事气泡。'
    }
  },
  {
    delay: 10500,
    action: 'enterInterior'
  },
  {
    delay: 13200,
    action: 'announce',
    payload: {
      text: '室内复原影像播放完成，接下来看看社区活动。'
    }
  },
  {
    delay: 16000,
    action: 'showCommunity'
  },
  {
    delay: 18800,
    action: 'announce',
    payload: {
      text: '梧桐之夜城市沙龙仍有 6 个名额，欢迎评委报名体验。'
    }
  },
  {
    delay: 21500,
    action: 'moveToHouse',
    payload: {
      houseId: 'gaolan-road-9'
    }
  },
  {
    delay: 24300,
    action: 'showValuation'
  },
  {
    delay: 27200,
    action: 'announce',
    payload: {
      text: '通过估值面板可以看到保值指数 88 分，并给出差异化投资建议。'
    }
  },
  {
    delay: 30500,
    action: 'moveToHouse',
    payload: {
      houseId: 'yongfu-road-200'
    }
  },
  {
    delay: 33200,
    action: 'announce',
    payload: {
      text: '永福路 200 号是梧桐深处共创空间的试点，我们在此完成故事共创。'
    }
  }
];
