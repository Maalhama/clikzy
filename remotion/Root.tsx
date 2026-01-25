import { Composition } from 'remotion';
import { HelloWorld } from './HelloWorld';
import { ClikzyPromo } from './ClikzyPromo';
import { ClikzyProPro } from './ClikzyProPro';
import { ClikzyVertical } from './ClikzyVertical';
import { ClikzyAd } from './ClikzyAd';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ClikzyPromo"
        component={ClikzyPromo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ClikzyProPro"
        component={ClikzyProPro}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ClikzyVertical"
        component={ClikzyVertical}
        durationInFrames={693}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ClikzyAd"
        component={ClikzyAd}
        durationInFrames={378}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
