#import "NetworkDiagnosticsModule.h"

#import <NetworkExtension/NetworkExtension.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>
#import <SystemConfiguration/CaptiveNetwork.h>
#import <os/log.h>

using namespace facebook;

@interface NetworkDiagnosticsModule ()
@property(nonatomic, assign) os_log_t logger;
@end

@implementation NetworkDiagnosticsModule

RCT_EXPORT_MODULE(NetworkDiagnostics);

- (instancetype)init {
  if (self = [super init]) {
    _logger = os_log_create("com.vibecode.diagnostics", "NetworkDiagnostics");
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (std::shared_ptr<react::TurboModule>)getTurboModule:(const react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<react::ObjCTurboModule>(params);
}

- (NSDictionary *)dictionaryFromHotspotNetwork:(NEHotspotNetwork *)network API_AVAILABLE(ios(14.0)) {
  if (network == nil) {
    return @{};
  }

  NSString *security = @"unknown";
  if (@available(iOS 15.0, *)) {
    switch (network.securityType) {
    case NEHotspotNetworkSecurityTypeOpen:
      security = @"open";
      break;
    case NEHotspotNetworkSecurityTypeWEP:
      security = @"wep";
      break;
    case NEHotspotNetworkSecurityTypePersonal:
      security = @"wpa2";
      break;
    case NEHotspotNetworkSecurityTypeEnterprise:
      security = @"enterprise";
      break;
    case NEHotspotNetworkSecurityTypeUnknown:
    default:
      security = @"unknown";
      break;
    }
  } else {
    security = network.secure ? @"wpa2" : @"open";
  }

  NSNumber *signal = @(network.signalStrength);
  NSNumber *channel = @(network.channelNumber);

  return @{ 
    @"ssid" : network.SSID ?: @"", 
    @"bssid" : network.BSSID ?: @"", 
    @"signalLevel" : signal, 
    @"channel" : channel, 
    @"security" : security, 
  };
}

- (NSDictionary *)dictionaryFromCaptiveNetwork:(NSDictionary *)info {
  if (!info) {
    return @{};
  }

  NSString *ssid = info[(__bridge NSString *)kCNNetworkInfoKeySSID];
  NSString *bssid = info[(__bridge NSString *)kCNNetworkInfoKeyBSSID];

  return @{ @"ssid" : ssid ?: @"", @"bssid" : bssid ?: @"", @"security" : @"unknown" };
}

RCT_REMAP_METHOD(scanWifiNetworks,
                 scanWifiNetworksWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (@available(iOS 14.0, *)) {
    [NEHotspotNetwork fetchCurrentWithCompletionHandler:^(NEHotspotNetwork *_Nullable network) {
      if (network == nil) {
        os_log_info(self.logger, "No active hotspot network");
        resolve(@[]);
        return;
      }

      NSDictionary *payload = [self dictionaryFromHotspotNetwork:network];
      resolve(@[payload]);
    }];
    return;
  }

  CFArrayRef interfaces = CNCopySupportedInterfaces();
  if (!interfaces) {
    os_log_error(self.logger, "Failed to enumerate WiFi interfaces");
    resolve(@[]);
    return;
  }

  NSMutableArray *networks = [NSMutableArray array];
  for (NSString *interfaceName in (__bridge_transfer NSArray *)interfaces) {
    CFDictionaryRef networkInfo = CNCopyCurrentNetworkInfo((__bridge CFStringRef)interfaceName);
    if (networkInfo) {
      NSDictionary *info = (__bridge_transfer NSDictionary *)networkInfo;
      [networks addObject:[self dictionaryFromCaptiveNetwork:info]];
    }
  }

  resolve(networks);
}

RCT_REMAP_METHOD(getCurrentNetwork,
                 getCurrentNetworkWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (@available(iOS 14.0, *)) {
    [NEHotspotNetwork fetchCurrentWithCompletionHandler:^(NEHotspotNetwork *_Nullable network) {
      if (network == nil) {
        os_log_info(self.logger, "No current hotspot network");
        resolve(nil);
        return;
      }

      NSDictionary *payload = [self dictionaryFromHotspotNetwork:network];
      resolve(payload);
    }];
    return;
  }

  CFArrayRef interfaces = CNCopySupportedInterfaces();
  if (!interfaces) {
    resolve(nil);
    return;
  }

  for (NSString *interfaceName in (__bridge_transfer NSArray *)interfaces) {
    CFDictionaryRef networkInfo = CNCopyCurrentNetworkInfo((__bridge CFStringRef)interfaceName);
    if (networkInfo) {
      NSDictionary *info = (__bridge_transfer NSDictionary *)networkInfo;
      resolve([self dictionaryFromCaptiveNetwork:info]);
      return;
    }
  }

  resolve(nil);
}

RCT_REMAP_METHOD(getVpnStatus,
                 getVpnStatusWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  NEVPNManager *manager = [NEVPNManager sharedManager];
  NEVPNConnection *connection = manager.connection;
  NEVPNStatus status = connection.status;

  BOOL active = status == NEVPNStatusConnected || status == NEVPNStatusConnecting || status == NEVPNStatusReasserting;
  NSString *statusString = @"disconnected";
  switch (status) {
  case NEVPNStatusInvalid:
    statusString = @"invalid";
    break;
  case NEVPNStatusDisconnected:
    statusString = @"disconnected";
    break;
  case NEVPNStatusConnecting:
    statusString = @"connecting";
    break;
  case NEVPNStatusConnected:
    statusString = @"connected";
    break;
  case NEVPNStatusReasserting:
    statusString = @"reasserting";
    break;
  case NEVPNStatusDisconnecting:
    statusString = @"disconnecting";
    break;
  }

  resolve(@{ @"active" : @(active), @"type" : statusString, @"hasRoute" : @(active) });
}

RCT_REMAP_METHOD(startPacketCapture,
                 startPacketCaptureWithOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *reason =
      @"iOS packet capture is restricted. Use a tethered rvictl session from macOS per the documentation.";
  os_log_error(self.logger, "%{public}@", reason);
  reject(@"E_IOS_CAPTURE_UNSUPPORTED", reason, nil);
}

RCT_REMAP_METHOD(stopPacketCapture,
                 stopPacketCaptureWithSessionId:(NSString *)sessionId
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *reason =
      @"stopPacketCapture invoked without an active rvictl tunnel. Manage lifecycle from the tethered host.";
  os_log_error(self.logger, "%{public}@", reason);
  reject(@"E_IOS_CAPTURE_UNSUPPORTED", reason, nil);
}

@end
