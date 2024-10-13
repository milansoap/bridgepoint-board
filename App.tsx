/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
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

const backendUrl = "https://romantic-musical-glider.ngrok-free.app";

function App(): React.JSX.Element {

  const [uniqueId, setUniqueId]                                = useState<string | null>(null);
  const [currentComponent, setCurrentComponent]                = useState(0); // State to keep track of the component to display
  const [products, setProducts]                                = useState<Array<any>>([]); // State to hold products array
  const [contentMapping, setContentMapping]                    = useState<{ [key: string]: string }>({});
  const [backgroundVideoPath, setBackgroundVideoPath]          = useState<string | null>(null); // State to store the background video path
  const [emptyStateImageDufry, setEmptyStateImageDufry]        = useState<string | null>(null); // State to store the background video path
  const [loadingProductsChanged, setLoadingProductsChanged]    = useState(false); // State to hold products array
  
  const getDiscountedPrice = (originalPrice: number, discount: number) => {
    return (originalPrice - originalPrice * discount).toFixed(2);
  };

  useEffect(() => {
    const initializeApp = async () => {
      downloadBackgroundVideo();
      downloadEmptyStateImageDufry();
      StatusBar.setHidden(true);
  
      // Fetch unique device ID first
      try {
        const id = await DeviceInfo.getUniqueId();
        setUniqueId(id); // Set the unique ID in state
  
        // Start the interval only after fetching the ID
        const intervalTimes = [20000, 10000, 10000]; // 20 seconds for case 0, 10 seconds for others
        let currentIndex = 0;
    
        const interval = setInterval(() => {
          setCurrentComponent(currentIndex);
          currentIndex = (currentIndex + 1) % intervalTimes.length;
        }, intervalTimes[currentIndex]);
    
        // Cleanup the interval on unmount
        return () => clearInterval(interval);
        
      } catch (error) {
        // Handle error if needed
      }
    };
  
    initializeApp(); // Initialize the app on component mount
  
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
    const interval = setInterval(fetchData, 5000000);
    return () => clearInterval(interval); // Cleanup interval on component unmount

  }, [uniqueId]); // Empty dependency array, runs only on mount
  

  const downloadBackgroundVideo = async () => {

    // THIS IS BACKGROUND VIDEO!!
    const videoId = '670a8fe419570f13b35c63d3'; // Background video ID
    const filePath = `${RNFS.DocumentDirectoryPath}/${videoId}.video`; // Path to save the video
    const fileExists = await RNFS.exists(filePath);

    if (!fileExists) {
      try {

        const downloadUrl = `${backendUrl}/files/${videoId}`;
        await RNFS.downloadFile({
          fromUrl: downloadUrl,
          toFile: filePath,
        }).promise;

        setBackgroundVideoPath(filePath); // Store the video path in state
      } catch (error) {
      }
    } else {
      setBackgroundVideoPath(filePath); // Store the video path if it already exists
    }
  };

  // Function to download the background video
  const downloadEmptyStateImageDufry = async () => {

    const dufryImage = '670abcd6c2e7df3eb68ba492'; // Background video ID
    const filePath = `${RNFS.DocumentDirectoryPath}/${dufryImage}.jpg`; // Path to save the video
    const fileExists = await RNFS.exists(filePath);

    if (!fileExists) {
      try {

        const downloadUrl = `${backendUrl}/files/${dufryImage}`;
        await RNFS.downloadFile({
          fromUrl: downloadUrl,
          toFile: filePath,
        }).promise;

        setEmptyStateImageDufry(filePath); // Store the video path in state
      } catch (error) {

      }
    } else {
      // updateStatus({ id: dufryImage, status: 'already_exists', message: 'Image already exists' });
      setEmptyStateImageDufry(filePath); // Store the video path if it already exists
    }
  };

   // Function to download content files
   const downloadContent = async (contentArray: Content[]): Promise<void> => {
    const mapping: ContentMapping = {};

    for (const content of contentArray) {
      const filePath = `${RNFS.DocumentDirectoryPath}/${content.id}.${content.type}`;
      const fileExists = await RNFS.exists(filePath);

      if (!fileExists) {
        try {
          const downloadUrl = `${backendUrl}/files/${content.id}`;
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

    switch (currentComponent) {
      case 0: // First component: Prices with product details
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

              <View key={`background-video`}>
                {backgroundVideoPath ? (
                    <Video
                      source={{ uri: `file://${backgroundVideoPath}` }}
                      style={[firstSectionStyles.absoluteVideo, { width: 3600, height: 300 }]}
                      controls={false} // Set to false to disable video controls
                      resizeMode="cover" // Ensure the video fills the container
                      paused={false} // Ensure the video is not paused
                      repeat={true} // Ensure the video loops
                      muted={true} // Ensure the video is muted (for debugging)
                      playInBackground={true}
                      disableFocus={true}
                      onError={(error) => console.log('Video Error:', error)} // Add error handling
                      onBuffer={() => console.log('Buffering...')} // Add buffering detection
                      onLoad={() => console.log('Video loaded successfully')} // Check when the video is loaded
                    />

                ) : (
                  <>
                    <Text>Video is loading or unavailable</Text>
                  </>
                )}
              </View>

              <View key={'product_prices_view'} style={firstSectionStyles.productSection}>
                {products.map((product, index) => (
                  <View key={index} style={firstSectionStyles.productCard}>

                      <Text style={firstSectionStyles.offerLabel}>SPECIAL OFFER</Text>

                      <View style={firstSectionStyles.priceContainer}>
                        <Text style={firstSectionStyles.productTitle}>{product.articleDescription}</Text>
                        <View style={firstSectionStyles.priceValues}>
                          {product.sellingPrice && (
                            <>
                              <Text style={firstSectionStyles.discountedPrice}>
                                €{getDiscountedPrice(product.sellingPrice, 0.25)}
                              </Text>
                              <Text style={firstSectionStyles.originalPrice}>
                                €{product.sellingPrice}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>

                        <Text style={firstSectionStyles.productVendor}>{product.vendorName}</Text>
                      </View>
                  ))}
                </View>
            </ScrollView>
          </View>
        );
      case 1: // Second component: Image display
      return (
        <View style={secondSectionStyles.container}>
          <ScrollView contentContainerStyle={secondSectionStyles.imagesSectionContainer}>
          
            {products.length > 0 &&
              products.map((product, index) => {
                
                if (!product.imgUrl) {
                  return null; // Skip if imgUrl is missing
                }
      
                const filePath = contentMapping[product.imgUrl]; // Get file path from contentMapping
              
                return (
                  filePath ? (
                    <View key={`${product.imgUrl}-${index}`} style={secondSectionStyles.imageWrapper}>
                      <Image
                        source={{ uri: `file://${filePath}` }} // Load from the local file system
                        style={secondSectionStyles.imageStyle} // Image style from StyleSheet
                      />
                    </View>
                  ) : (
                    <Text key={`${product.imgUrl}-${index}`} style={{ color: '#fff' }}>Image not available</Text>
                  )
                );
            })}
          </ScrollView>
        </View>
      );
      case 2:
        return (
          <View style={secondSectionStyles.container}>
            <ScrollView contentContainerStyle={secondSectionStyles.imagesSectionContainer}>            
              {products.length > 0 &&
              products.map((product, index) => {

                if (!product.videoUrl) {
                  return null; // Skip if videoUrl is missing
                }

                const videoPath = contentMapping[product.videoUrl];
                console.log(videoPath);
                return (
                  
                  videoPath ? (
                    
                    <View key={`${product.videoUrl}-${index}`} style={{ marginBottom: 20, marginRight: 10 }}>
                      
                      <Video
                        source={{ uri: `file://${videoPath}` }} // Load from the local file system
                        style={{ width: 700, height: 300 }} // Adjust size and style as needed
                        controls={false} // Add controls like play, pause, etc.
                        resizeMode="cover" // Ensure the video covers the space
                        paused={false} // Ensure the video plays automatically
                        repeat={true} // Optional: Set to true if you want videos to loop
                        muted={true} // Ensure the video plays with sound
                        playInBackground={true}
                        disableFocus={true}
                      />
                    </View>
                  ) : (
                    <Text key={`${product.videoUrl}-${index}`} style={{ color: '#fff' }}>Video not available</Text>
                  )
                );
              })}
            </ScrollView>
          </View>
         );
      default:
        return null;
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
            source={{ uri: `file://${emptyStateImageDufry}` }} // Load from the local file system
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
    flex: 1, // Makes the product section take up the remaining space
    flexDirection: 'row', // Aligns products in a column for better spacing
    position: 'relative',
    maxWidth: '100%',
    fontFamily: 'Montserrat'
  },
  productSection: {
    flex: 1, // Makes the product section take up the remaining space
    flexDirection: 'row', // Aligns products in a column for better spacing
    justifyContent: 'space-evenly', // Ensures even spacing between products
    position: 'relative',
    maxWidth: '100%'
  },

  absoluteVideo: {
    position: 'absolute', // This makes the video absolute
    top: 0,               // Adjust the position as needed
    left: 0,              // Adjust the position as needed
    zIndex: -1,           // Send the video to the background
  },
  
  qrSection: {
    width: '7%', // Reduced width to 5% for the QR code area
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRightColor: '#333',
  },
  qrText: {
    color: '#fff',
    fontSize: 12, // Reduced font size for the QR code label
    textAlign: 'center',
  },

  
  productCard: {
    backgroundColor: '#222',
    // borderRadius: 8,
    maxWidth: 600,
    minWidth: 500,
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

const secondSectionStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imagesSectionContainer: {
    flexDirection: 'row', // Align images horizontally
    justifyContent: 'space-between', // Ensure even spacing between images
    alignItems: 'center', // Align images vertically centered
    width: '100%',
    paddingHorizontal: 10, // Add padding so images don't touch the edges
  },
  imageWrapper: {
    flex: 1, // Each image wrapper takes up equal space
    justifyContent: 'center', // Center the content vertically
    paddingHorizontal: 5, // Add spacing between each image wrapper
  },
  imageStyle: {
    width: '100%', // Make the image take up the full width of the wrapper
    height: 300, // Set a consistent height for the images
    resizeMode: 'contain', // Make sure the image fits within its container
  },
});

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
  
  productCard: {
    padding: 10,
    borderRadius: 8,
    borderColor: '#333',
    position: 'relative',
    borderWidth: 1,
    marginLeft: 10,
    marginRight: 10,
    flex: 1,
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
