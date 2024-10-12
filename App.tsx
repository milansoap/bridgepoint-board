/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
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
import { reporter } from './metro.config';

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

// const deviceIdFilePath = `${RNFS.DocumentDirectoryPath}/device_id.txt`;

// Function to register the device if no ID is found
const registerDevice = async (deviceId: string) => {
  try {
    // Make a POST request to the URL with the deviceId in the path
    const response = await fetch(`https://romantic-musical-glider.ngrok-free.app/devices/${deviceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Sending an empty body for the device registration
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

  } catch (error) {
    console.error('[Debug] Error registering device:', error);
    return null;
  }
};


function App(): React.JSX.Element {

  const [currentComponent, setCurrentComponent] = useState(0); // State to keep track of the component to display
  const [products, setProducts] = useState<Array<any>>([]); // State to hold products array
  const [contentMapping, setContentMapping] = useState<{ [key: string]: string }>({});
  const [downloadStatuses, setDownloadStatuses] = useState<DownloadStatus[]>([]); // State to track download statuses
  const [backgroundVideoPath, setBackgroundVideoPath] = useState<string | null>(null); // State to store the background video path
  const [emptyStateImageDufry, setEmptyStateImageDufry] = useState<string | null>(null); // State to store the background video path
  const [loadingProductsChanged, setLoadingProductsChanged] = useState(false); // State to hold products array
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // State to manage loading
  const [configurationFetched, setconfigurationFetched] = useState(false); // State to manage loading

  useEffect(() => {
    const fetchUniqueId = async () => {
      try {
        const id = await DeviceInfo.getUniqueId(); // Await the unique ID
        // console.log('Device Unique ID:', id); // Log the unique ID
        setUniqueId(id); // Set the unique ID in state
      } catch (error) {
        console.error('Error fetching unique ID:', error);
      } finally {
        setLoading(false); // Set loading to false after ID is fetched
      }
    };

    fetchUniqueId(); // Fetch the unique ID on component mount
  }, []);

  const getDiscountedPrice = (originalPrice: number, discount: number) => {
    return (originalPrice - originalPrice * discount).toFixed(2);
  };
  
  const getDiscount = () => {
    const discounts = [0.1, 0.2, 0.15, 0.25]; // 10%, 20%, 15%, 25%, etc.
    return discounts[Math.floor(Math.random() * discounts.length)];
  };

  useEffect(() => {
    const fetchData = async () => {
      if (uniqueId) { // Ensure uniqueId is available
        try {
          console.log('Sending request...');
          const response = await fetch(`https://romantic-musical-glider.ngrok-free.app/devices/configuration/${uniqueId}`);   
          const newConfig = await response.json();
       
          // Compare current products with the new products



          // ovde si imao problem newconfig product details je []

          if (JSON.stringify(newConfig.productDetails) !== JSON.stringify(products)) {
            setLoadingProductsChanged(true);
            console.log("Products have changed");

            console.log(newConfig.productDetails)
            // console.log(JSON.stringify(products))

            // Update products and download new content if the products have changed
            setProducts(newConfig.productDetails || []);
            downloadContent(newConfig.contentToDownload || []);
            setconfigurationFetched(true);
            setLoadingProductsChanged(false);
          }
          else {
            console.log('products have not changed')
          }
        } catch (error) {
          console.error('[Debug] Error occurred while fetching data:', error);
        } 
      }
    };
  
    fetchData(); // Start the initial fetch
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval); // Cleanup interval on component unmount

  }, [uniqueId]); // Empty dependency array, runs only on mount
  

  const fetchDeviceConfiguration = async (uniqueId: string) => {
  
    try {
      let response = await fetch(`https://romantic-musical-glider.ngrok-free.app/devices/configuration/${uniqueId}`);
  
      if (response.status === 404) {
        await registerDevice(uniqueId); // Register the device if not found
        response = await fetch(`https://romantic-musical-glider.ngrok-free.app/devices/configuration/${uniqueId}`); // Re-fetch configuration after registering
      }
  
      const json = await response.json();
  
      // Handle fetched data here, such as setting products and downloading content
      if (json.productDetails?.length > 0) {
        setProducts(json.productDetails || []);
        downloadContent(json.contentToDownload || []);
        setconfigurationFetched(true);
      }
  
    } catch (error) {
      console.error('[Debug] Error occurred while fetching data:', error); // Debug statement
    }
  };
  

  useEffect(() => {
    StatusBar.setHidden(true); // Hides the status bar
    if (uniqueId) { // Ensure this runs only when uniqueId is available
      fetchDeviceConfiguration(uniqueId);
    }
  }, [uniqueId]); // This effect will run only when uniqueId changes
  

  const downloadBackgroundVideo = async () => {

    const videoId = '670abcd6c2e7df3eb68ba492'; // Background video ID
    const filePath = `${RNFS.DocumentDirectoryPath}/${videoId}.mp4`; // Path to save the video
    const fileExists = await RNFS.exists(filePath);

    if (!fileExists) {
      try {
        updateStatus({ id: videoId, status: 'downloading', message: 'Downloading background video' });

        const downloadUrl = `https://romantic-musical-glider.ngrok-free.app/files/${videoId}`;
        await RNFS.downloadFile({
          fromUrl: downloadUrl,
          toFile: filePath,
        }).promise;

        updateStatus({ id: videoId, status: 'completed', message: 'Background video downloaded' });
        setBackgroundVideoPath(filePath); // Store the video path in state
      } catch (error) {
        updateStatus({ id: videoId, status: 'error', message: 'Error downloading background video' });
      }
    } else {
      updateStatus({ id: videoId, status: 'already_exists', message: 'Background video already exists' });
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
        updateStatus({ id: dufryImage, status: 'downloading', message: 'Downloading empty state  image' });

        const downloadUrl = `https://romantic-musical-glider.ngrok-free.app/files/${dufryImage}`;
        await RNFS.downloadFile({
          fromUrl: downloadUrl,
          toFile: filePath,
        }).promise;

        updateStatus({ id: dufryImage, status: 'completed', message: 'Empty state image downloaded' });
        setEmptyStateImageDufry(filePath); // Store the video path in state
      } catch (error) {
        updateStatus({ id: dufryImage, status: 'error', message: 'Error downloading empty state image' });
      }
    } else {
      updateStatus({ id: dufryImage, status: 'already_exists', message: 'Image already exists' });
      setEmptyStateImageDufry(filePath); // Store the video path if it already exists
    }
  };
  
  const updateStatus = (status: DownloadStatus) => {
    setDownloadStatuses((prevStatuses) => [
      ...prevStatuses.filter((s) => s.id !== status.id), // Remove previous status for the same content ID
      status, // Add the new status
    ]);
    // console.log(`${status.id}: ${status.status} - ${status.message}`);
  };

   // Function to download content files
   const downloadContent = async (
    contentArray: Content[]
  ): Promise<void> => {
    const mapping: ContentMapping = {};

    for (const content of contentArray) {
      const filePath = `${RNFS.DocumentDirectoryPath}/${content.id}.${content.type}`;
      // const filePath = `${RNFS.DownloadDirectoryPath}/${content.id}.${content.type}`;
      const fileExists = await RNFS.exists(filePath);

      if (!fileExists) {
        try {
          updateStatus({ id: content.id, status: 'downloading', message: `Downloading file ${content.id}` });

          const downloadUrl = `https://romantic-musical-glider.ngrok-free.app/files/${content.id}`;
          await RNFS.downloadFile({
            fromUrl: downloadUrl,
            toFile: filePath,
          }).promise;

          updateStatus({ id: content.id, status: 'completed', message: `File downloaded: ${filePath}` });
        } catch (error) {
          updateStatus({ id: content.id, status: 'error', message: `Error downloading file ${content.id}` });
        }
      } else {
        updateStatus({ id: content.id, status: 'already_exists', message: `File already exists: ${filePath}` });
      }

      mapping[content.id] = filePath; // Map content ID to its local file path
    }

    setContentMapping(mapping); // Update state with the mapping
  };

  useEffect(() => {
    // Timer to change components every 5 seconds
    downloadBackgroundVideo();
    downloadEmptyStateImageDufry();
    const interval = setInterval(() => {
      setCurrentComponent(prevComponent => (prevComponent + 1) % 3);
      // setCurrentComponent(2);

    }, 6000);
    return () => clearInterval(interval); // Cleanup the interval on component unmount
  }, []);

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
                  <>
                    {/* {console.log('Rendering Video with path:', backgroundVideoPath)} */}
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
                      // onError={(error) => console.log('Video Error:', error)} // Add error handling
                      // onBuffer={() => console.log('Buffering...')} // Add buffering detection
                      // onLoad={() => console.log('Video loaded successfully')} // Check when the video is loaded
                    />
                  </>
                ) : (
                  <>
                    {/* {console.log('No backgroundVideoPath, not rendering video')} */}
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
                                €{getDiscountedPrice(product.sellingPrice, getDiscount())}
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
                // console.log('Product Video:', product);

                if (!product.videoUrl) {
                  // console.log(`Product ${index} has no videoUrl`);
                  return null; // Skip if videoUrl is missing
                }

                const videoPath = contentMapping[product.videoUrl];

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
                        muted={false} // Ensure the video plays with sound
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
        <Text>Fetching Device ID and Configuration...</Text>
      </View>
    )
  }

  // Render empty state if the products are empty
  else if (products.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={firstSectionStyles.productSectionContainer}>
          <View style={firstSectionStyles.qrSection}>
            <Text style={firstSectionStyles.qrText}>QR CODE AREA</Text>
            {/* <Image source={require('./src/images/device_123_qr_code.png')} style={{ width: 150, height: 150 }} /> */}
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
        <ScrollView contentContainerStyle={styles.mainContainer}>
          <SafeAreaView style={styles.container}>
            {renderComponent()}
          </SafeAreaView>
        </ScrollView>
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

  

  // // Show a loading screen until the app is fully initialized
  // if (loading === true || !uniqueId) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       {/* <ActivityIndicator size="large" color="#0000ff" /> */}
  //       <Text>Fetching Device ID and Configuration...</Text>
  //       <Image
  //           source={{ uri: `file://${emptyStateImageDufry}` }} // Load from the local file system
  //           style={secondSectionStyles.imageStyle} // Image style from StyleSheet
  //         />
  //     </View>
  //   );
  // }

  // if (uniqueId && configurationFetched) {
  //   return (
  //     <View style={styles.container}>
  //       <ScrollView contentContainerStyle={styles.mainContainer}>
  //         <SafeAreaView style={styles.container}>
  //           {/* {renderComponent()} */}
  //         </SafeAreaView>
  //       </ScrollView>
  //     </View>
  //   );
  // }

  // else {
  //   return (<>
  //   <View>
  //     <Text>Something went wrong</Text>
  //   </View>
  //   </>);
  // }
  
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
    // backgroundColor: '#222',
    // marginVertical: 5, // Even vertical margin between product cards
    padding: 10,
    borderRadius: 8,
    borderColor: '#333',
    position: 'relative',
    borderWidth: 1,
    marginLeft: 10,
    marginRight: 10,
    flex: 1, // Allows the product card to take up equal width within the row
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
