import {Platform} from 'react-native';
import NfcManager, {NfcTech, Ndef, NfcEvents} from 'react-native-nfc-manager';
import {AppEvents, AppEventName} from './AppEvents';

const NfcAndroidUI = AppEvents.get(AppEventName.NFC_SCAN_UI);
const LogRecord = AppEvents.get(AppEventName.LOG_RECORD);

class ErrSuccess extends Error {}

class NfcProxy {
  constructor() {
    NfcManager.start();
  }

  readNdefOnce = () => {
    const cleanUp = () => {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.setEventListener(NfcEvents.SessionClosed, null);
    };

    return new Promise((resolve) => {
      let tagFound = null;

      NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
        tagFound = tag;
        resolve(tagFound);
        NfcManager.setAlertMessageIOS('NDEF tag found');
        NfcManager.unregisterTagEvent().catch(() => 0);
      });

      NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
        cleanUp();
        if (!tagFound) {
          resolve();
        }
      });

      NfcManager.registerTagEvent();
    });
  };

  readTag = async () => {
    let tag = null;
    try {
      if (Platform.OS === 'ios') {
        // because we also want to read the id from it!
        await NfcManager.requestTechnology([
          NfcTech.MifareIOS,
          NfcTech.Iso15693IOS,
          NfcTech.IsoDep,
        ]);
      } else {
        NfcAndroidUI.emit('OPEN');
        await NfcManager.requestTechnology([NfcTech.Ndef]);
      }

      tag = await NfcManager.getTag();
    } catch (ex) {
      console.warn(ex);
    }

    this.abort();
    return tag;
  };

  writeNdefTwice = async () => {
    let result = false;
    try {
      if (Platform.OS === 'ios') {
        await NfcManager.requestTechnology(NfcTech.Ndef);
      } else {
        NfcAndroidUI.emit('OPEN');
        await NfcManager.requestTechnology(NfcTech.Ndef);
      }

      let bytes;

      bytes = Ndef.encodeMessage([Ndef.textRecord('hello')]);
      await NfcManager.writeNdefMessage(bytes);

      const tag = await NfcManager.getTag();
      console.warn('tag', tag);

      bytes = Ndef.encodeMessage([Ndef.textRecord('hello again')]);
      await NfcManager.writeNdefMessage(bytes);

      result = true;
    } catch (ex) {
      console.warn(ex);
    }

    this.abort();
    return result;
  };

  writeNdef = async ({type, value}) => {
    let result = false;
    try {
      if (Platform.OS === 'ios') {
        await NfcManager.requestTechnology(NfcTech.Ndef);
      } else {
        NfcAndroidUI.emit('OPEN');
        await NfcManager.requestTechnology(NfcTech.Ndef);
      }

      if (type === 'TEXT') {
        let bytes = Ndef.encodeMessage([Ndef.textRecord(value)]);
        await NfcManager.writeNdefMessage(bytes);
      } else if (type === 'URI') {
        let bytes = Ndef.encodeMessage([Ndef.uriRecord(value)]);
        await NfcManager.writeNdefMessage(bytes);
      } else if (type === 'WIFI_SIMPLE') {
        let bytes = Ndef.encodeMessage([Ndef.wifiSimpleRecord(value)]);
        await NfcManager.writeNdefMessage(bytes);
      }
      result = true;
    } catch (ex) {
      console.warn(ex);
    }

    this.abort();
    return result;
  };

  customTransceiveNfcA = async (payloads) => {
    let err = new ErrSuccess();
    let responses = [];

    try {
      if (Platform.OS === 'ios') {
        await NfcManager.requestTechnology([NfcTech.MifareIOS]);
      } else {
        NfcAndroidUI.emit('OPEN');
        await NfcManager.requestTechnology([NfcTech.Ndef]);
      }

      for (const payload of payloads) {
        let resp;
        if (Platform.OS === 'ios') {
          resp = await NfcManager.sendMifareCommandIOS(payload);
        } else {
          resp = await NfcManager.transceive(payloads);
        }
        responses.push(resp);
        await delay(100);
      }
    } catch (ex) {
      console.warn(ex);
      err = ex;
    }

    this.abort();

    if (err instanceof ErrSuccess) {
      return [null, responses];
    }

    return [err, responses];
  };

  abort = async () => {
    NfcManager.cancelTechnologyRequest().catch(() => 0);
    NfcAndroidUI.emit('CLOSE');
  };

  transceive = async (bytes, msg) => {
    this.dbgLog(msg, 'send', bytes);
    let respBytes = null;
    if (Platform.OS === 'ios') {
      respBytes = await NfcManager.sendMifareCommandIOS(bytes);
    } else {
      respBytes = await NfcManager.transceive(bytes);
    }
    this.dbgLog(msg, 'recv', respBytes);
    return respBytes;
  };

  dbgLog = (msg, type, data) => {
    let dataStr = '';

    if (Array.isArray(data)) {
      for (let byte of data) {
        dataStr += toHex(byte) + ' ';
      }
    } else if (data !== undefined) {
      dataStr = toHex(data);
    }

    console.log(`[${msg}-${type}] ${dataStr}`);
    LogRecord.emit({message: msg, type, data: dataStr, created: new Date()});
  };

  calcChecksum = (bytes) => {
    let result = 0;
    for (let byte of bytes) {
      result = result ^ byte;
      result &= 0xff;
    }
    return result;
  };
}

// ------------------------
//  Utils
// ------------------------
const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const toHex = (num) => {
  return ('00' + num.toString(16)).slice(-2);
};

const arrToHex = (arr) => {
  let hex = '';
  for (let byte of arr) {
    hex += toHex(byte);
  }
  return hex;
};

const uidToBytes = (uidStr) => {
  if (uidStr.length !== 14) {
    throw new Error('incorrect uid length');
  }

  let bytes = [];
  for (let i = 0; i < 14; i = i + 2) {
    bytes.push(parseInt(uidStr.slice(i, i + 2), 16));
  }
  return bytes;
};

const pinToBytes = (pinStr) => {
  pinStr = ('000000' + parseInt(pinStr).toString(16)).slice(-6);

  let bytes = [];
  for (let i = 0; i < pinStr.length; i = i + 2) {
    bytes.push(parseInt(pinStr.slice(i, i + 2), 16));
  }
  return bytes;
};

const hexToBytes = (hex) => {
  let bytes = [];
  for (let i = 0; i < hex.length; i = i + 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
};

export default new NfcProxy();
export {ErrSuccess};
