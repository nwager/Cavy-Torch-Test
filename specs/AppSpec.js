import { focusText, blueText, _keyboardDidShow, _keyboardDidHide, blurText } from './helpers';
import { Keyboard } from 'react-native';

export default function(spec) {
    spec.describe('Renaming scene', function() {
      spec.it('works', async function() {
        //await spec.pause(10000);
        await spec.press('ScenePropPill');
        await spec.pause(1000);
        await spec.fillIn('EditSceneName', "Hello");
        await spec.pause(1000);
        const text = await spec.findComponent('EditSceneName');
        text.keyboardListener = Keyboard.addListener('keyboardDidShow', _keyboardDidShow);
        text.keyboardListener = Keyboard.addListener('keyboardDidHide', _keyboardDidHide);
        await focusText(text);
        await spec.pause(2000);
        await blurText(text);
        await spec.pause(10000)

      });
    });
  }