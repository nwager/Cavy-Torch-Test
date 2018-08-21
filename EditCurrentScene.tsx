import { observer } from 'mobx-react/native';
import React, { Component } from 'react';
import { View } from 'react-native';
import { Transition } from 'react-navigation-fluid-transitions';

import { CloseThin } from 'rn/components/core/icons';
import { HollowIconPill, HollowPill } from 'rn/components/core/pills';
import { InjectedProps, withDesignEnvironmentState } from 'rn/mobx/stores/DesignEnvironmentState';
import { InjectedProps as UIProps, withUIState } from 'rn/mobx/stores/UIState';
import { trackEvent } from 'rn/utils/analytics';
import TextInput, { MultilineTextInput } from '../../TextInput';
import theme, { Colors, epicSize } from '../../theme';
import { Row } from '../../View';
import ActionButton from './ActionButton';
import SceneCollaborators from './SceneCollaborators';
import styles from './styles';

interface IEditCurrentSceneProps extends InjectedProps {
  onClosePress: () => void;
  onToggleOptions: () => void;
}
type Props = IEditCurrentSceneProps & UIProps;

@withDesignEnvironmentState
@withUIState
@observer
export default class EditCurrentScene extends Component<Props> {
  private nameRef: TextInput | null;
  private descriptionRef: MultilineTextInput | null;

  public componentWillUnmount() {
    if (this.sceneProperties.isDirty) {
      this.sceneProperties.reset();
    }
  }

  public render() {
    const { isKeyboardOpen } = this.props.uiState;
    return (
      <>
        <View style={[styles.fullWidth, { zIndex: 3, height: epicSize(20), top: epicSize(-16) }]}>
          <Transition anchor="scenePill">
            <View
              style={{
                alignItems: 'center',
                borderRadius: theme.pillSizes.small.height / 2,
                height: theme.pillSizes.small.height,
                justifyContent: 'center',
                position: 'absolute',
                right: 0,
                width: theme.pillSizes.small.height,
                zIndex: 10,
              }}
            >
              {!isKeyboardOpen && <HollowIconPill icon={CloseThin} onPress={this.onClosePress} />}
            </View>
          </Transition>
          <Transition shared="scenePill">
            <HollowPill pillWidth={epicSize(176)} style={{ alignSelf: 'center' }} debugName={'EditScenePill'}>
              <TextInput
                enablesReturnKeyAutomatically={true}
                numberOfLines={1}
                onChangeText={this.onChangeProperty('name')}
                placeholder="TAP TO NAME NEW SCENE"
                placeholderTextColor={Colors.lightGray}
                ref={i => (this.nameRef = i)}
                returnKeyType="done"
                style={[styles.nameInput, styles.fullWidth]}
                value={this.sceneProperties.name}
                debugName="EditSceneName"
              />
            </HollowPill>
          </Transition>
        </View>
        <Transition anchor="scenePill">
          <View style={[styles.container, styles.fullWidth]}>
            <MultilineTextInput
              ref={i => (this.descriptionRef = i)}
              placeholder="Tap here to give your scene a brief description..."
              value={this.sceneProperties.description}
              style={[styles.descriptionInput, styles.fullWidth]}
              onChangeText={this.onChangeProperty('description')}
            />
            <Row style={[styles.detailsRow, styles.fullWidth]}>
              <View width={1} height={1} style={[styles.detailsRowSide, { paddingLeft: epicSize(4) }]} />
              <SceneCollaborators marginRight={epicSize(8)} style={styles.detailsRowSide} />
            </Row>
          </View>
        </Transition>
        {isKeyboardOpen && (
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: epicSize(8),
            }}
          >
            <ActionButton label="CANCEL" onPress={this.onCancel} />
            <ActionButton label="SAVE" onPress={this.onSaveChanges} fontColor={Colors.blue} />
          </View>
        )}
      </>
    );
  }

  private get sceneProperties() {
    return this.props.designEnvironmentState.currentScene!.properties;
  }

  private onClosePress = () => {
    this.sceneProperties.submit();
    this.props.onClosePress();
  };

  private onCancel = () => {
    this.sceneProperties.reset();
    this.props.onClosePress();
  };

  private onChangeProperty = (property: 'name' | 'description') => (value: string) => {
    if (property === 'name') {
      this.sceneProperties.name = value;
    } else if (property === 'description') {
      this.sceneProperties.description = value;
    }
  };

  private onSaveChanges = () => {
    this.sceneProperties.submit();
    trackEvent('scene_edited', {
      scene_id: this.props.designEnvironmentState.currentSceneId,
      with_description: this.sceneProperties.description && this.sceneProperties.description.length > 0,
    });
    this.props.onClosePress();
  };
}
