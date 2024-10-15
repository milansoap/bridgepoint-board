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
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import Video from 'react-native-video';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';

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
const backendUrl = "https://romantic-musical-glider.ngrok-free.app";
const amazonUrl = 'https://bridge-point-bucket.s3.eu-north-1.amazonaws.com';

function App(): React.JSX.Element {

  const [uniqueId, setUniqueId]                                = useState<string | null>(null);
  const [products, setProducts]                                = useState<Array<any>>([]); // State to hold products array
  const [contentMapping, setContentMapping]                    = useState<{ [key: string]: string }>({});
  const [loadingProductsChanged, setLoadingProductsChanged]    = useState(false); // State to hold products array

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
       
          if (JSON.stringify(newConfig.productDetails) !== JSON.stringify(products)) {

            // Update products and download new content if the products have changed
            setProducts(newConfig.productDetails || []);
            downloadContent(newConfig.contentToDownload || []);
            setLoadingProductsChanged(false);
          }
          
        } catch (error) {
          console.error('[Debug] Error occurred while fetching data:', error);
        } 
      }
    };
  
    fetchData(); // Start the initial fetch
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval); // Cleanup interval on component unmount

  }, [uniqueId]); // Empty dependency array, runs only on mount

  const downloadContent = async (contentArray: Content[]): Promise<void> => {
    const mapping: ContentMapping = {};
    console.log(contentArray)

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

    return (
      <View style={styles.container}>

        <ScrollView contentContainerStyle={firstSectionStyles.productSectionContainer}>
          <View style={firstSectionStyles.qrSection}>
            <Text style={firstSectionStyles.qrText}>QR CODE AREA</Text>

            {uniqueId &&
              <QRCode
                value={uniqueId}
                size={150}
              />
            }
            
          </View>

          <View key={'product_prices_view'} style={firstSectionStyles.productSection}>
            {products.map((product, index) => {

              let amazonImage = `${amazonUrl}/${product.imgUrl}`;
              let videoPath = contentMapping[product.videoUrl];

              // Check if video URL ends with .mp4 and adjust to .video
              if (product.videoUrl.endsWith('.mp4')) {
                const modifiedUrl = product.videoUrl.replace('.mp4', '.video');
                videoPath = contentMapping[modifiedUrl] || videoPath; // Use the modified URL if found, fallback to original
              }          

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
                          source={{ uri: `file://${videoPath}`}} // Load from the local file system
                          style={{ width: 450, height: 300 }} // Adjust size and style as needed
                          controls={false} // Add controls like play, pause, etc.
                          resizeMode="cover" // Ensure the video covers the space
                          paused={false} // Ensure the video plays automatically
                          repeat={true} // Optional: Set to true if you want videos to loop
                          muted={true} // Ensure the video plays with sound
                          playInBackground={true}
                          disableFocus={true}
  
                          // onLoad={() => console.log('Video loaded successfully:', videoPath)}
                          // onError={(error) => console.error('Video failed to load:', error)}
                          // onBuffer={(buffer) => console.log('Buffering:', buffer)}
                          // onProgress={(data) => console.log('Video progress:', data.currentTime)}
                          // onEnd={() => console.log('Video finished playing.')}
                          // onLoadStart={() => console.log('Video load started.')}
                          // onReadyForDisplay={() => console.log('Video ready for display.')}
  
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

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={firstSectionStyles.productSectionContainer}>
          <View style={firstSectionStyles.qrSection}>
              <QRCode
                value={uniqueId}
                size={150}
              />
          </View>

          

          <Image
            source={{ uri: amazonDufry}} // Load from the local file system
            style={emptyStateImageDufryStyles.image} // Image style from StyleSheet
          />
        </ScrollView>
      </View>
    ) 
  } 
  
  else if (uniqueId && products.length > 0) {
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
  },
  imageStyle: { 
    height: deviceHeight,
    width: 450
  },
  productCombo: {
    flexDirection: 'row',
    justifyContent: 'center'
  },

  productComboContent: {
    height: '100%',
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
  qrText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#201f1f',
    maxWidth: 600,
    minWidth: 500,
    height: '100%',
    padding: 20,
    color: 'white',
  },
  offerLabel: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 23,
    marginBottom: 8,
  },
  priceContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '90%',
    height: 180,
    borderColor: 'white',
    borderWidth: 1,
    padding: 10
  },
  productTitle: {
    color: '#fff',
    fontSize: 18,
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
    fontSize: 60,
    marginTop: 48,
    alignItems: 'baseline',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  originalPrice: {
    fontSize: 48,
    color: '#ccc',
    textDecorationLine: 'line-through',
  },

  productVendor: {
    color: '#fff',
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
    maxWidth: '101%',
    maxHeight: '100%'
  },

});

export default App;
