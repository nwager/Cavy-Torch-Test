import { action } from 'mobx';
import { observer } from 'mobx-react/native';
import React, { Component } from 'react';
import { View } from 'react-native';
import { Transition } from 'react-navigation-fluid-transitions';

import { Chevron } from 'rn/components/core/icons';
import { HollowIconPill, HollowTextPill } from 'rn/components/core/pills';
import { epicSize } from 'rn/components/core/style';
import { InjectedProps, withDesignEnvironmentState } from 'rn/mobx/stores/DesignEnvironmentState';
import SceneState from 'rn/mobx/stores/SceneState';
import { DesignView, InjectedProps as UIDesignStateProps, withUIDesignState } from 'rn/mobx/stores/UIDesignState';
import { trackEvent } from 'rn/utils/analytics';
import { hitSlop } from '../theme';
import { Row } from '../View';

type Props = InjectedProps & UIDesignStateProps;

@withDesignEnvironmentState
@withUIDesignState
@observer
export default class ScenePill extends Component<Props> {
  public render() {
    const { previousScene, currentScene, nextScene } = this.props.designEnvironmentState;

    return (
      <Row alignItems="center" justifyContent="center">
        {previousScene && (
          <HollowIconPill
            icon={Chevron}
            iconStyle={{ marginLeft: epicSize(-1), transform: [{ rotate: '180deg' }] }}
            onPress={this.onChangeScene(previousScene)}
          />
        )}
        <View width={32 + (previousScene ? 0 : epicSize(16))} /> {/* These spacers fix overlapping hitSlop issues. */}
        <Transition shared="scenePill">
          <HollowTextPill
            label={currentScene!.properties.name}
            pillWidth={epicSize(160)}
            style={{ zIndex: 4 }}
            hitSlop={hitSlop}
            onPress={this.onOpenSceneDrawer}
            debugName={'ScenePropPill'}
          />
        </Transition>
        <View width={32 + (nextScene ? 0 : epicSize(16))} /> {/* These spacers fix overlapping hitSlop issues. */}
        {nextScene && (
          <HollowIconPill
            icon={Chevron}
            onPress={this.onChangeScene(nextScene)}
            iconStyle={{ marginLeft: epicSize(1) }}
          />
        )}
      </Row>
    );
  }

  private onOpenSceneDrawer = () => {
    trackEvent('scene_drawer_opened');
    this.props.uiDesignState.presentView(DesignView.scenes);
  };

  @action
  private onChangeScene = (scene: SceneState) => () => {
    this.props.designEnvironmentState.switchScene(scene.sceneId);
  };
}
