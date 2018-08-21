import glamorous from 'glamorous-native';
import React, { Component, PureComponent } from 'react';
import {
  NativeModules,
  StyleProp,
  TextInput as ReactTextInput,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from 'react-native';

import Text from '../Text';
import theme, { ColorNames, Colors, getColor, getSize, hitSlop, Sizes } from '../theme';

import { hook } from 'cavy';

const { View } = glamorous;

type BaseTextInputProps = Pick<
  TextInputProps,
  Exclude<keyof TextInputProps, 'blurOnSubmit' | 'multiline' | 'onSubmitEditing' | 'onEndEditing'>
>;

interface ITextInputProps extends BaseTextInputProps {
  onSubmit?: () => void;
  debugName: string;
}

class BaseTextInput extends PureComponent<ITextInputProps> {
  public refs: {
    wrappedInput: ReactTextInput;
  };

  public render() {
    const { style, ...restProps } = this.props;

    return (
      <ReactTextInput
        ref="wrappedInput"
        hitSlop={hitSlop}
        placeholderTextColor={Colors.darkGray}
        style={this.textInputStyles}
        {...restProps}
      />
    );
  }

  // TODO: Figure out how to proxy all methods through to wrappedInput.
  public clear() {
    return this.refs.wrappedInput.clear();
  }

  public focus() {
    return this.refs.wrappedInput.focus();
  }

  public isFocused() {
    return this.refs.wrappedInput.isFocused();
  }

  protected get textInputStyles(): StyleProp<TextStyle> {
    const { style = {} } = this.props;

    return [
      {
        fontFamily: theme.fontFamily,
        fontWeight: '600',
      },
      style,
    ];
  }
}

/*export default */class TextInput extends BaseTextInput {
  public render() {
    const { style, onBlur, returnKeyType, ...restProps } = this.props;

    let blurOnSubmit = true;
    if (returnKeyType === 'next') {
      blurOnSubmit = false;
    }

    return (
      <ReactTextInput
        blurOnSubmit={blurOnSubmit}
        hitSlop={hitSlop}
        onBlur={this.onBlur}
        onSubmitEditing={this.onSubmitEditing}
        placeholderTextColor={Colors.darkGray}
        ref={this.updateRef}
        returnKeyType={returnKeyType}
        style={this.textInputStyles}
        {...restProps}
      />
    );

  }
  private updateRef = (ref) => {
    this.refs.wrappedInput = ref;
    this.props.generateTestHook(this.props.debugName)(ref);
  }

  private onSubmitEditing = () => {
    NativeModules.TCHKeyboard.dismiss();
    this.props.onSubmit && this.props.onSubmit();
  };

  private onBlur = () => {
    if (this.props.returnKeyType !== 'next') {
      NativeModules.TCHKeyboard.dismiss();
    }
    this.props.onBlur && this.props.onBlur();
  };
}

export class MultilineTextInput extends BaseTextInput {
  public render() {
    const { style, onBlur, ...restProps } = this.props;

    return (
      <ReactTextInput
        ref="wrappedInput"
        multiline={true}
        hitSlop={hitSlop}
        placeholderTextColor={Colors.darkGray}
        style={this.textInputStyles}
        onBlur={this.onBlur}
        {...restProps}
      />
    );
  }

  private onBlur = () => {
    this.props.onSubmit && this.props.onSubmit();
    NativeModules.TCHKeyboard.dismiss();
    this.props.onBlur && this.props.onBlur();
  };
}

const TextInputTest = hook(TextInput);
export default TextInputTest;

interface ITextControlProps extends TextInputProps {
  color?: ColorNames;
  label?: string;
  size?: Sizes;
  style?: ViewStyle;
}

interface ITextControlState {
  active: boolean;
}

export class TextControl extends Component<ITextControlProps, ITextControlState> {
  public static defaultProps: ITextControlProps = {
    color: 'white',
  };

  public state: ITextControlState = {
    active: false,
  };

  public render() {
    const { color, label, size, style, onFocus, onBlur, ...textInputProps } = this.props;

    return (
      <View style={this.viewStyles}>
        {label ? (
          <Text color={this.themeColor.primary} fontSize={this.themeSize.fontSize - 6}>
            {label}
          </Text>
        ) : null}
        <TextInput style={this.textInputStyles} onFocus={this.onFocus} onBlur={this.onBlur} {...textInputProps} />
      </View>
    );
  }

  private get viewStyles(): ViewStyle {
    const { style = {} } = this.props;

    return Object.assign(
      {
        borderBottomColor: this.currentColor,
        borderBottomWidth: 2,
        padding: 4,
        width: 'auto',
      },
      style
    );
  }

  private get textInputStyles(): TextStyle {
    return {
      color: this.currentColor,
      fontSize: theme.fontSize! + 6,
    };
  }

  private get themeColor() {
    return getColor(this.props.color);
  }

  private get themeSize() {
    return getSize(this.props.size);
  }

  private get currentColor() {
    const { editable } = this.props;
    if (editable !== undefined && !editable) {
      return Colors.lightGray;
    }
    return this.themeColor.primary;
  }

  private onFocus = () => {
    this.setState({
      active: true,
    });

    this.props.onFocus && this.props.onFocus();
  };

  private onBlur = () => {
    this.setState({
      active: false,
    });

    this.props.onBlur && this.props.onBlur();
  };
}
