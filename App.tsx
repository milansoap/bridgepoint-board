/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import Video, { BufferConfig, ViewType } from 'react-native-video';
import QRCode from 'react-native-qrcode-svg';

interface Content {
  id: string;
  type: string;
}

interface ContentMapping {
  [key: string]: string;
}

interface DownloadStatus {
  id: string;
  status: 'downloading' | 'completed' | 'already_exists' | 'error';
  message: string;
}

const deviceHeight = Dimensions.get('window').height;
const calculatedHeight = deviceHeight * 0.8; // 80% of the device height

const backendUrl = "http://104.248.134.34:80";
const amazonUrl = 'https://bridge-point-bucket.s3.eu-north-1.amazonaws.com';

function App(): React.JSX.Element {

  const [uniqueId, setUniqueId]                                = useState<string | null>(null);
  const [products, setProducts]                                = useState<Array<any>>([]); // State to hold products array
  const [contentMapping, setContentMapping]                    = useState<{ [key: string]: string }>({});
  const [loadingProductsChanged, setLoadingProductsChanged]    = useState(false); // State to hold products array

  
  const optimizedBufferConfig: BufferConfig = {
    minBufferMs: 5000,  // Minimum buffer duration in milliseconds
    maxBufferMs: 10000,  // Maximum buffer duration in milliseconds
    bufferForPlaybackMs: 1000,  // Minimum buffer duration before playback starts
    bufferForPlaybackAfterRebufferMs: 2000,  // Buffer duration after rebuffering
    backBufferDurationMs: 0,  // Keep no back-buffer to avoid memory buildup
    maxHeapAllocationPercent: 0.5,  // Allocate only 50% of heap size to avoid overuse
    minBufferMemoryReservePercent: 0.1,  // Reserve at least 10% of free memory for playback
  };

  // const RETRY_DELAY = 3000; // Retry delay in milliseconds
  // const MAX_RETRY_COUNT = 50; // Max retry attempts

  const getDiscountedPrice = (originalPrice: number, discount: number) => {
    return (originalPrice - originalPrice * discount).toFixed(2);
  };

  useEffect(() => {
    const initializeApp = async () => {
      
      StatusBar.setHidden(true);
  
      try {
        const id = await DeviceInfo.getUniqueId();
        setUniqueId(id); 
        
      } catch (error) {
        // Handle error if needed
      }
    };
  
    initializeApp();
  
  }, []);

  
  useEffect(() => {
    const fetchData = async () => {

      if (uniqueId) {
        try {
          const response  =   await fetch(`${backendUrl}/devices/configuration/${uniqueId}`);
          const newConfig =   await response.json();

          if (response.status === 404) {

            await fetch(`http://104.248.134.34:80/devices/${uniqueId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });
          }

          
          if (newConfig.productDetails !== products) {

            // Update products and download new content if the products have changed
            setProducts(newConfig.productDetails || []);
            downloadContent(newConfig.contentToDownload || []);
            setLoadingProductsChanged(false);
          }

          if (newConfig.productDetails.length === 0) {
            setProducts([])
          }




          
        } catch (error) {

        } 
      }
    };
  
    fetchData(); // Start the initial fetch
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval); // Cleanup interval on component unmount

  }, [uniqueId]); // Empty dependency array, runs only on mount

  const downloadContent = async (contentArray: Content[]): Promise<void> => {
    const mapping: ContentMapping = {};

    // listFilesInDirectory(RNFS.DocumentDirectoryPath);

    for (const content of contentArray) {

      let filePath = `${RNFS.DocumentDirectoryPath}/${content.id}`;

      if (content.id.endsWith('.mp4')) {
        filePath = filePath.replace('.mp4', '.video');
      }

      const fileExists = await RNFS.exists(filePath);


      if (!fileExists) {
        try {
          const downloadUrl = `${backendUrl}/bucket/download/${content.id}`;
          await RNFS.downloadFile({
            fromUrl: downloadUrl,
            toFile: filePath,
          }).promise;

        } catch (error) {

        }
      } 

      mapping[content.id] = filePath; // Map content ID to its local file path
    }

    setContentMapping(mapping); // Update state with the mapping
  };

  const renderComponent = () => {
  
    const isVideo = (content: string) => /\.(mp4|avi|mkv|mov)$/i.test(content);
    const isImage = (content: string) => /\.(jpg|jpeg|png|gif)$/i.test


    if (products.length === 0) {

      let amazonDufry = `${amazonUrl}/dufry.jpg`;
      
      const qrSectionWidth = Dimensions.get('window').width * 0.07; // 7% of screen width
      let qrCodeSize = 100;

      if (qrSectionWidth > 240) {
        qrCodeSize = qrSectionWidth * 0.45; // 80% of qrSection width
      } else {
        qrCodeSize = qrSectionWidth * 0.75; // 80% of qrSection width
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={firstSectionStyles.productSectionContainer}>
            <View style={firstSectionStyles.qrSection}>
              <View style={firstSectionStyles.qrCodeContainer}>
                {uniqueId &&
                  <QRCode
                    value={uniqueId}
                    size={qrCodeSize} // Ensures the QR code adapts to the container's size
                  />
                }
              </View>

            </View>
  
            <Image
              source={{ uri: amazonDufry}} 
              style={emptyStateImageDufryStyles.image}
            />
          </ScrollView>
        </View>
      ) 
    } else {

      const qrSectionWidth = Dimensions.get('window').width * 0.07; // 7% of screen width
      let qrCodeSize = 100;

      if (qrSectionWidth > 240) {
        qrCodeSize = qrSectionWidth * 0.45; // 80% of qrSection width
      } else {
        qrCodeSize = qrSectionWidth * 0.75; // 80% of qrSection width
      }


      return (
        <View style={styles.container}>
  
          <ScrollView contentContainerStyle={firstSectionStyles.productSectionContainer}>
            <View style={firstSectionStyles.qrSection}>
              <Text style={firstSectionStyles.qrText}>QR CODE AREA</Text>
                <View style={firstSectionStyles.qrCodeContainer}>
                  {uniqueId &&
                    <QRCode
                      value={uniqueId}
                      size={qrCodeSize}
                    />
                  }
              </View>
            </View>
  
            <View key={'product_prices_view'} style={firstSectionStyles.productSection}>
              {products.map((product, index) => {
  
                let amazonImage = `${amazonUrl}/${product.contentUrl}`;
                let videoPath = contentMapping[product.contentUrl];
  
                return (
                  <View style={firstSectionStyles.productCombo}>
  
                    <View key={index} style={firstSectionStyles.productCard}>
  
                      <Text style={firstSectionStyles.offerLabel}>SPECIAL OFFER</Text>
  
                      <View style={firstSectionStyles.priceContainer}>
                        <Text style={firstSectionStyles.productTitle}>{product.name}</Text>
                        <View style={firstSectionStyles.priceValues}>
                          {product.price && (
                            <>
                              <Text style={firstSectionStyles.discountedPrice}>
                                €{getDiscountedPrice(product.price, 0.25)}
                              </Text>
                              <Text style={firstSectionStyles.originalPrice}>
                                €{product.price}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
  
                      <Text style={firstSectionStyles.productVendor}>{product.brand}</Text>
  
                    </View>
  
                    <View key={`${product.videoUrl}-${index}`} style={firstSectionStyles.productComboContent}>
  
                      {isVideo(product.contentUrl) && (
                          
                        <Video
                            key={`${product.videoUrl}-${index}`}
                            source={{ uri: `file://${videoPath}`}} // Load from the local file system
                            style={{ width: 460, height: deviceHeight }} // Adjust size and style as needed
                            controls={false} // Add controls like play, pause, etc.
                            resizeMode="cover" // Ensure the video covers the space
                            paused={false} // Ensure the video plays automatically
                            repeat={true} // Optional: Set to true if you want videos to loop
                            muted={true} // Ensure the video plays with sound
                            playInBackground={true}
                            disableFocus={true}
                            bufferConfig={optimizedBufferConfig}
                            viewType={ViewType.SURFACE}
                            // onError={(error) => {
                            //   setTimeout(retryVideo, RETRY_DELAY);  // Retry after delay
                            // }} 
                            // onLoad={handleVideoLoad}                         
    
                          />
                      )}
  
                      {isImage(product.contentUrl) && (
                        <View key={`${product.imgUrl}-${index}`} style={firstSectionStyles.imageStyle}>
                          <Image
                            source={{ uri: amazonImage }} 
                            style={firstSectionStyles.imageStyle} 
                            resizeMode="cover"
                          />
                        </View>
                      )}
  
                    </View>
  
                  </View>
                )})}
              </View>
          </ScrollView>
        </View>
      );


    }

  };

  if (!uniqueId || loadingProductsChanged === true) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24 }}>Fetching Device ID and Configuration...</Text>
      </View>
    )
  }

  // Render empty state if the products are empty
  else if (products.length === 0) {

    let amazonDufry = `${amazonUrl}/dufry.jpg`;
    
    const qrSectionWidth = Dimensions.get('window').width * 0.07; // 7% of screen width
    let qrCodeSize = 100;

    if (qrSectionWidth > 240) {
      qrCodeSize = qrSectionWidth * 0.45; // 80% of qrSection width
    } else {
      qrCodeSize = qrSectionWidth * 0.75; // 80% of qrSection width
    }

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={firstSectionStyles.productSectionContainer}>
          <View style={firstSectionStyles.qrSection}>
            <View style={firstSectionStyles.qrCodeContainer}>

              <QRCode
                value={uniqueId}
                size={qrCodeSize} // Ensures the QR code adapts to the container's size
                />
                
            </View>

          </View>

          <Image
            source={{ uri: amazonDufry}} 
            style={emptyStateImageDufryStyles.image}
          />
        </ScrollView>
      </View>
    ) 
  } 
  
  else if (uniqueId && products.length !== 0) {
    return (
      <View style={styles.container}>
        {/* <ScrollView contentContainerStyle={styles.mainContainer}> */}
          {/* <SafeAreaView style={styles.container}> */}
            {renderComponent()}
          {/* </SafeAreaView> */}
        {/* </ScrollView> */}
      </View>
    )
    
  }

  else {
    return (
      <>
        <View>
          <Text>Something went wrong</Text>
        </View>
      </>
    );
  }
  
}

const firstSectionStyles = StyleSheet.create({
  
  productSectionContainer: {
    flex: 1, 
    flexDirection: 'row',
    position: 'relative',
    maxWidth: '100%',
    height: deviceHeight,
    maxHeight: deviceHeight
  },
  imageStyle: { 
    height: deviceHeight,
    maxWidth: 600,
    width: 460
  },
  productCombo: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  productComboContent: {
    height: deviceHeight,
  },
  productSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    position: 'relative',
    maxWidth: '100%',
  },
  qrSection: {
    width: '7%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRightColor: '#333',
  },
  qrCodeContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#201f1f',
    maxWidth: 600,
    minWidth: 500,
    height: deviceHeight,
    maxHeight: deviceHeight,
    minHeight: deviceHeight,
    padding: 20,
    color: 'white',
  },
  offerLabel: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 23,
    marginBottom: 8,
    height: '10%'
  },
  priceContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    // width: '90%',
    height: '80%',
    borderColor: 'white',
    borderWidth: 1,
    padding: 10
  },
  productTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
  },
  priceValues: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    textAlign: 'center',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  discountedPrice: {
    fontSize: 70,
    marginTop: 48,
    alignItems: 'baseline',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  originalPrice: {
    fontSize: 58,
    color: '#ccc',
    textDecorationLine: 'line-through',
  },

  productVendor: {
    color: '#fff',
    height: '10%',
    fontSize: 17,
  },

})

const styles = StyleSheet.create({

  mainContainer: {
    flex: 1,
    position: 'relative',
    maxWidth: '100%',
    maxHeight: '100%'
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000',
  },
  
  productTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productVendor: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 5,
  },
  productPrice: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

const emptyStateImageDufryStyles = StyleSheet.create({

  image: {
    flex: 1,
    position: 'relative',
    maxWidth: '100%',
    maxHeight: '100%'
  },

});

export default App;
