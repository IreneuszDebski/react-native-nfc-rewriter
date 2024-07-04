import * as React from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
  Linking,
  TouchableOpacity,
} from 'react-native';
import NfcProxy from '../../NfcProxy';
import NfcManager, {Ndef, NfcEvents, NfcTech} from 'react-native-nfc-manager';
import {Button, IconButton} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import qs from 'query-string';
import {version} from '../../../package.json';


function HomeScreen(props) {
  const {navigation} = props;
  const [enabled, setEnabled] = React.useState(null);
  const padding = 30;
  const width = Dimensions.get('window').width - 4 * padding;
  const [gotProbe, setGotProbe]= React.useState(false);
  const [probeName, setProbeName]= React.useState('');
  const [latitude, setLatitude]= React.useState('');
  const [longitude, setLongitude]= React.useState('');

  React.useEffect(() => {
    async function initNfc() {
      try {
        setEnabled(await NfcProxy.isEnabled());

        function onBackgroundTag(bgTag) {
          /*
          navigation.navigate('Main', {
            screen: 'TagDetail',
            params: {tag: bgTag},
          });
          */
         readContents(bgTag);
        }



        /*
        function onDeepLink(url, launch) {
          try {

            if (!customScheme) {
              return;
            }

            url = url.slice(customScheme.length);

            // issue #23: we might have '?' in our payload, so we cannot simply "split" it
            let action = url;
            let query = '';
            let splitIdx = url.indexOf('?');

            if (splitIdx > -1) {
              action = url.slice(0, splitIdx);
              query = url.slice(splitIdx);
            }

            const params = qs.parse(query);
            if (action === 'share') {
              const sharedRecord = JSON.parse(params.data);
              if (sharedRecord.payload?.tech === NfcTech.Ndef) {
                navigation.navigate('Main', {
                  screen: 'NdefWrite',
                  params: {savedRecord: sharedRecord},
                });
              } else if (sharedRecord.payload?.tech === NfcTech.NfcA) {
                navigation.navigate('Main', {
                  screen: 'CustomTransceive',
                  params: {
                    savedRecord: sharedRecord,
                  },
                });
              } else if (sharedRecord.payload?.tech === NfcTech.NfcV) {
                navigation.navigate('Main', {
                  screen: 'CustomTransceive',
                  params: {
                    savedRecord: sharedRecord,
                  },
                });
              } else if (sharedRecord.payload?.tech === NfcTech.IsoDep) {
                navigation.navigate('Main', {
                  screen: 'CustomTransceive',
                  params: {
                    savedRecord: sharedRecord,
                  },
                });
              } else {
                console.warn('unrecognized share payload tech');
              }
            }
          } catch (ex) {
            console.warn('fail to parse deep link', ex);
          }
        }
        */

        // get the initial launching tag
        const bgTag = await NfcManager.getBackgroundTag();
        if (bgTag) {
          onBackgroundTag(bgTag);
        } else {

          /*
          const link = await Linking.getInitialURL();
          console.warn('DEEP LINK', link);
          if (link) {
            onDeepLink(link, true);
          }
          */
        }

        // listen to other background tags after the app launched
        NfcManager.setEventListener(
          NfcEvents.DiscoverBackgroundTag,
          onBackgroundTag,
        );

        // listen to the NFC on/off state on Android device
        if (Platform.OS === 'android') {
          NfcManager.setEventListener(
            NfcEvents.StateChanged,
            ({state} = {}) => {
              NfcManager.cancelTechnologyRequest().catch(() => 0);
              if (state === 'off') {
                setEnabled(false);
              } else if (state === 'on') {
                setEnabled(true);
              }
            },
          );
        }
        /*  
        Linking.addEventListener('url', (event) => {
          if (event.url) {
            onDeepLink(event.url, false);
          }
        });
        */
      } catch (ex) {
        
        Alert.alert('ERROR', 'Błąd inicjalizacji NFC', [{text: 'OK'}]);
      }
    }

    initNfc();
  }, [navigation]);

  function clearProbe() {
    setGotProbe(false);
    setProbeName('');
    setLongitude('');
    setLatitude('');
}



  function readContents(bgTag) {
    try
    {
    let messages=bgTag.ndefMessage;
    messages.forEach(element => {
      if (element.type.includes(0x54)) 
        {
          let text = Ndef.text.decodePayload(element.payload);
          if (text.startsWith('Probe:'))
            {
              setProbeName(text.substring(6));
              setGotProbe(true);
            }
        }
      if (element.type.includes(0x55)) 
        {
          let uri = Ndef.uri.decodePayload(element.payload);
          if (uri.startsWith('geo:'))
            {
              try
              {
              let location=uri.substring(4);
              let larray=location.split(',');
              setLatitude(larray[0]);
              setLongitude(larray[1]);
              }
              catch {
                setLatitude('');
                setLongitude('');
              }
            }
        }
      
    }); //messages.forEach
  }
    catch {};
}




  function renderNfcButtons() {
    return (
      <View
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 60,
          
        }}>
        <Button buttonColor='#00aa40' 
          mode="contained"
          onPress={async () => {
            clearProbe();
            const tag = await NfcProxy.readTag();
            if (tag) {
              //navigation.navigate('Main', {screen: 'TagDetail', params: {tag}});
              readContents(tag);
            }
          }}
          style={{width}}>
          Odczytaj tag NFC
        </Button>
      </View>
    );
  }

  function renderNfcNotEnabled() {
    return (
      <View
        style={{
          alignItems: 'stretch',
          alignSelf: 'center',
          width,
        }}>
        <Text style={{textAlign: 'center', marginBottom: 10}}>
          Your NFC is not enabled. Please first enable it and hit CHECK AGAIN
          button
        </Text>

        <Button
          mode="contained"
          onPress={() => NfcProxy.goToNfcSetting()}
          style={{marginBottom: 10}}>
          GO TO NFC SETTINGS
        </Button>

        <Button
          mode="outlined"
          onPress={async () => {
            setEnabled(await NfcProxy.isEnabled());
          }}>
          CHECK AGAIN
        </Button>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView />
      <View style={{flex: 1, padding}}>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}>
          <Image
            source={require('../../../images/agro-logo.png')}
            style={{width: 250, height: 250, marginTop:40}}
            resizeMode="contain"
          />

          {!gotProbe &&         
          <View>
          <Text
            style={{
              padding: 20,
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#666',
            }}>
            Czytnik tagów NFC
          </Text>
          <Text
            style={{
              padding: 0,
              fontSize: 12,
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#555',
            }}>
            ver. {version}
          </Text>
          </View>
          }
          {gotProbe && 
          <View>
          <Text
            style={{
              padding: 20,
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#666',
            }}>
            Próbka : {probeName}
          </Text>
          <Text
            style={{
              padding: 0,
              fontSize: 16,
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#555',
            }}>
            Pozycja :
          </Text>

          <Text
            style={{
              padding: 0,
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#666',
            }}>
            Lat: {latitude} N
          </Text>
          <Text
            style={{
              padding: 0,
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#666',
            }}>
            Lon: {longitude} E 
          </Text>

          </View>
        }


        </View>
        {enabled ? renderNfcButtons() : renderNfcNotEnabled()}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  settingIcon: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 0,
    right: 20,
  },
});

export default HomeScreen;
