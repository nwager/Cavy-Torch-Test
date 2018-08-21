import { observer } from 'mobx-react/native';
import React, { Component } from 'react';
import { Dimensions, Linking, NativeModules } from 'react-native';
import Analytics from 'react-native-analytics-segment-io';
import firebase from 'react-native-firebase';
import { GoogleSignin } from 'react-native-google-signin';
import Orientation from 'react-native-orientation-locker';
import { NavigationState } from 'react-navigation';

import FirebaseBridge from 'rn/mobx/bridges/App/Firebase';
import AppState, { Provider } from 'rn/mobx/stores/AppState';
import RootScreen from './components/screens/';
import Authenticate from './components/screens/Authenticate';
import Splash from './components/ui/Splash';
import { SEGMENT_API_KEY } from './config';

import { Tester, TestHookStore } from 'cavy';
import AppSpec from './specs/AppSpec';

const { TCHSecrets } = NativeModules;

GoogleSignin.configure({
  iosClientId: TCHSecrets.googleClientId,
});

if (SEGMENT_API_KEY && SEGMENT_API_KEY !== '') {
  Analytics.setup(SEGMENT_API_KEY, {
    trackApplicationLifecycleEvents: true,
    recordScreenViews: true,
  });
} else {
  Analytics.setup('', {
    trackApplicationLifecycleEvents: true,
    recordScreenViews: true,
    debug: true,
  });
}

/*
// Uncomment this block to enable mobx logging in the developer console
if (process.env.NODE_ENV === 'development') {
  const { spy } = require("mobx");
  const devlogger = require("rn/mobx/devlogger").default;
  spy(devlogger);
}
*/

function getActiveRouteName(navigationState: NavigationState) {
  if (!navigationState) {
    return undefined;
  }
  const route = navigationState.routes[navigationState.index];
  if (route.routes) {
    return getActiveRouteName(route as NavigationState);
  }

  return route.routeName;
}

const testHookStore = new TestHookStore();

const appStateActive = false;

@observer
class App extends Component {
  private appState: AppState | null = null;

  public async componentDidMount() {
    const { height, width } = Dimensions.get('window');
    const aspectRatio = height / width;
    const isPhone = aspectRatio >= 1.6;
    if (isPhone) {
      Orientation.lockToPortrait();
    } else {
      Orientation.unlockAllOrientations();
    }

    // Prevent warnings about orientationDidChange getting fired without a listener
    Orientation.addOrientationListener(() => {});

    Linking.getInitialURL().then(url => this.handleUrl({ url }));
    Linking.addEventListener('url', this.handleUrl);

    if (!appStateActive) {
      this.initAppState();
      this.setState({ appStateInit: true });
    } else {
      const waitForTeardown = new Promise(resolve => {
        const checkForActive = () => {
          if (!appStateActive) {
            setTimeout(() => {
              // Pause a bit to allow cleanup to finish.
              resolve();
            }, 10000);
          } else {
            setTimeout(checkForActive, 1000);
          }
        };
        setTimeout(checkForActive, 10);
      });
      await waitForTeardown;
      this.initAppState();
      this.setState({ appStateInit: true });
    }
  }

  public async componentWillUnmount() {
    Linking.removeEventListener('url', this.handleUrl);
    await this.appState.teardown();
    appStateActive = false;
  }

  public render() {
    if (!this.appState) {
      return <Splash />;
    }
    return (
      <Tester specs={[AppSpec]} store={testHookStore} waitTime={0}>
        <Provider appState={this.appState} uiState={this.appState.uiState}>
          {(() => {
            if (!this.appState.initialized) {
              return <Splash />;
            }
            if (!this.appState.user) {
              firebase.analytics().setCurrentScreen(null, 'Authenticate');
              return <Authenticate />;
            }
            return <RootScreen onNavigationStateChange={this.onNavigationStateChange} />;
          })()}
        </Provider>
      </Tester>
    );
  }

  private initAppState() {
    appStateActive = true;
    this.appState = new AppState();
    // tslint:disable-next-line:no-unused-expression
    new FirebaseBridge(this.appState);
  }

  private onNavigationStateChange = (previousState, currentState) => {
    const currentName = getActiveRouteName(currentState);
    const previousName = getActiveRouteName(previousState);

    if (previousName !== currentName) {
      Analytics.screen(currentName, {});
      firebase.analytics().setCurrentScreen(null, currentName);
    }
  };

  private handleUrl = ({ url }) => {
    if (!url) {
      return;
    }

    // FIXME this is a bit of a hack, but gets us moving in the short term
    // need to figure out a more general solution for this at some point (React Router?)
    const urlRE = /.+:\/\/(.+)\/(.+)/;
    const match = urlRE.exec(url);
    if (match) {
      const action = match[1];
      const param = match[2];
      switch (action) {
        case 'projects':
          if (param) {
            const projectId = param;
            console.debug(`Opening project ${projectId} from app link ${url}`);
            if (this.appState.user) {
              this.appState.switchProject(projectId);
            } else {
              this.appState.requestedProjectId = projectId;
            }
          } else {
            console.warn(`Invalid param ${param} for action ${action} in ${url}`);
          }
          break;
        default:
          console.warn(`Unsupported action ${action} in ${url}`);
      }
    } else {
      console.warn('Unsupported url: ', url);
    }
  };
}

export default class CavyApp extends React.Component {
  public render() {
    return (
      <Tester specs={[AppSpec]} store={testHookStore} waitTime={20000}>
        <App />
      </Tester>
    );
  }
}
