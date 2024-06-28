import React from 'react';
import {
  Image,
  Linking,
  View,
  ScrollView,
  Text,
  StyleSheet,
  Platform,
  Keyboard,
  Dimensions,
  Alert,
} from 'react-native';
import {Appbar, List, TextInput, Button} from 'react-native-paper';
import NfcManager, {NfcEvents} from 'react-native-nfc-manager';
import {version} from '../../../package.json';

const generalText = ``;

function SettingsScreen(props) {
  const [nfcStatus, setNfcStatus] = React.useState(null);
  const [feedback, setFeedback] = React.useState('');
  const [keyboardPadding, setKeyboardPadding] = React.useState(0);
  const scrollPosRef = React.useRef(0);

  React.useEffect(() => {
    function onNfcStateChanged(evt = {}) {
      const {state} = evt;
      setNfcStatus(state === 'on');
    }

    async function checkNfcState() {
      setNfcStatus(await NfcManager.isEnabled());
      NfcManager.setEventListener(NfcEvents.StateChanged, onNfcStateChanged);
    }

    if (Platform.OS === 'android') {
      checkNfcState();
    }

    return () => {
      if (Platform.OS === 'android') {
        NfcManager.setEventListener(NfcEvents.StateChanged, null);
      }
    };
  }, []);

  return (
    <>
      <Appbar.Header style={{backgroundColor: 'white'}}>
        <Appbar.BackAction onPress={() => props.navigation.goBack()} />
        <Text style={{marginLeft: 10, fontSize: 18}}>Ustawienia</Text>
      </Appbar.Header>
      <ScrollView style={[styles.wrapper]}>
        <List.Section>
          {Platform.OS === 'android' && (
            <>
              <List.Item
                title="NFC Status"
                description={
                  nfcStatus === null ? '---' : nfcStatus ? 'ON' : 'OFF'
                }
              />
              <List.Item
                title="Ustawienia NFC"
                description="Zmien ustawienia NFC"
                onPress={() => {
                  NfcManager.goToNfcSetting();
                }}
              />
            </>
          )}
          <List.Item title="Version" description={version} />
        </List.Section>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  topBanner: {
    borderRadius: 6,
    margin: 10,
    paddingHorizontal: 15,
    backgroundColor: 'white',
  },
  maintainerIcon: {
    width: 54,
    height: 54,
    overflow: 'hidden',
    borderRadius: 4,
  },
});

export default SettingsScreen;
