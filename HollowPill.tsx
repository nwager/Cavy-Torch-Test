import { observable } from 'mobx';
import { observer } from 'mobx-react/native';
import React, { Component } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View, ViewProps, ViewStyle } from 'react-native';
import { FlareView, IFlareConfig } from '../flare';
import { color, epicSize, springScale } from '../style';

import { hook } from 'cavy';

/**
 * `HollowPill` is a base component meant to be composed with other components. See `HollowTextPill` and `HollowIconPill`.
 */

interface IProps {
  disabled?: boolean;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  pillHeight?: number;
  pillWidth?: ViewStyle['width'];
  debugName: string;
}
export type HollowPillProps = IProps & ViewProps;

const borderWidth = epicSize(1.5);

@observer
/*export default */class HollowPill extends Component<HollowPillProps> {
  public static defaultProps: HollowPillProps = {
    disabled: false,
    pillHeight: epicSize(20),
    pillWidth: 'auto',
  };

  private delaying = false;
  @observable
  private transition: 'pressIn' | 'pressOut' = 'pressOut';

  public render() {
    const { pillWidth } = this.props;
    const pillHeight = this.props.pillHeight!;
    const sizing = {
      borderRadius: pillHeight / 2,
      height: pillHeight,
      width: pillWidth,
    };
    const shadowHeight = sizing.height - borderWidth * 2;

    return (
      <TouchableWithoutFeedback
        onPress={this.onPress}
        onPressIn={this.onPressIn}
        onPressOut={this.onPressOut}
        ref={this.props.generateTestHook(this.props.debugName)}
        {...this.props}
      >
        <FlareView
          config={borderTransitions}
          transition={this.transition}
          {...this.props}
          style={[styles.border, sizing, this.props.style]}
        >
          <View
            style={[
              styles.shadow,
              {
                borderRadius: shadowHeight / 2,
                height: shadowHeight,
                width: '100%',
              },
            ]}
          />
          {this.props.children}
        </FlareView>
      </TouchableWithoutFeedback>
    );
  }

  private onPress = (): void => {
    if (this.props.disabled) {
      return;
    }
    // depending on the content of onPress, this can cause a hiccup in the js renderer. pushing onto the next tick
    // fixes the stutter
    if (this.delaying) {
      return;
    }
    this.delaying = true;
    setTimeout(() => {
      if (this.props.onPress) {
        this.props.onPress();
      }
      this.delaying = false;
    }, 0);
  };

  private onPressIn = (): void => {
    if (this.props.disabled) {
      return;
    }
    this.transition = 'pressIn';
    if (this.props.onPressIn) {
      this.props.onPressIn();
    }
  };

  private onPressOut = (): void => {
    if (this.props.disabled) {
      return;
    }
    this.transition = 'pressOut';
    if (this.props.onPressOut) {
      this.props.onPressOut();
    }
  };
}

const HollowPillTest = hook(HollowPill);
export default HollowPillTest;

const styles = StyleSheet.create({
  border: {
    alignItems: 'center',
    backgroundColor: color('textBackground'),
    borderColor: color('white'),
    borderWidth,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  shadow: {
    borderColor: color('black'),
    borderWidth: 0.5,
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

const timing = springScale();

const borderTransitions = {
  pressIn: {
    scale: [0.95, timing],
  },
  pressOut: {
    scale: [1.0, timing],
  },
} as IFlareConfig;
