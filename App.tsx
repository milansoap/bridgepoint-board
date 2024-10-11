/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import type {PropsWithChildren} from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';


import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';


function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const [currentComponent, setCurrentComponent] = useState(0); // State to keep track of the component to display
  const [products, setProducts] = useState<Array<any>>([]); // State to hold products array

  useEffect(() => {
    StatusBar.setHidden(true); // Hides the status bar
    console.log('[Debug] useEffect started: Status bar hidden'); // Debug statement

    console.log('[Debug] Fetching data from API...'); // Debug statement
    fetch('https://romantic-musical-glider.ngrok-free.app/devices/configuration/device_123')
      .then((response) => {
        console.log('[Debug] Response received from API:', response); // Debug statement
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`); // Error if status is not 200-299
        }
        return response.json(); // Convert response to JSON
      })
      .then((json) => {
        console.log('[Debug] JSON data parsed:', json); // Debug statement
        setProducts(json.productsOnDisplay || []); // Set the products array from the response
      })
      .catch((error) => {
        console.error('[Debug] Error occurred while fetching data:', error); // Debug statement
      });
  }, []);


  useEffect(() => {
    // Timer to change components every 5 seconds
    const interval = setInterval(() => {
      setCurrentComponent(prevComponent => (prevComponent + 1) % 3);
    }, 5000);
    return () => clearInterval(interval); // Cleanup the interval on component unmount
  }, []);


  const renderComponent = () => {
    switch (currentComponent) {
      case 0: // First component: Prices with product details
        return (
          <ScrollView contentContainerStyle={styles.productSection}>
            {products.map((product, index) => (
              <View key={index} style={styles.productCard}>
                <Text style={styles.productTitle}>{product.articleDescription}</Text>
                <Text style={styles.productVendor}>{product.vendorName}</Text>
                <Text style={styles.productPrice}>Price: ${product.sellingPrice}</Text>
              </View>
            ))}
          </ScrollView>
        );
      case 1: // Second component: Image display
        return (
          <View style={styles.imageSection}>
            {products.length > 0 && (
             
             <Text style={styles.productPrice}>DRUGA KOMPONENTA</Text>

              // <Image
              //   source={{ uri: `https://your-image-url/${products[0]?.imgUrl}` }}
              //   style={styles.image}
              // />
            )}
          </View>
        );
      case 2: // Third component: Video display
        return (
          <View style={styles.videoSection}>
              <Text style={styles.productPrice}>TRECA KOMPONENTA</Text>

            {/* <Text style={styles.videoText}>Video Placeholder</Text> */}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Left section for QR code */}
      <View style={styles.qrSection}>
        <Text style={styles.qrText}>QR CODE AREA</Text>
        <Image source={require('./src/images/device_123_qr_code.png')} style={{ width: 150, height: 150 }} />
        
      </View>

      {/* Right section for products */}
      <ScrollView contentContainerStyle={styles.productSection}>

      <SafeAreaView style={styles.container}>
        {renderComponent()}
      </SafeAreaView>

        {/* {products.map((product, index) => (
          <View key={index} style={styles.productCard}>
            <Text style={styles.productTitle}>{product.articleDescription}</Text>
            <Text style={styles.productVendor}>{product.vendorName}</Text>
            <Text style={styles.productPrice}>Price: ${product.sellingPrice}</Text>
          </View>
        ))} */}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000',
  },
  qrSection: {
    width: '5%', // Reduced width to 5% for the QR code area
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  qrText: {
    color: '#fff',
    fontSize: 12, // Reduced font size for the QR code label
    textAlign: 'center',
  },
  productSection: {
    flex: 1, // Makes the product section take up the remaining space
    flexDirection: 'row', // Aligns products in a column for better spacing
    justifyContent: 'space-evenly', // Ensures even spacing between products
    padding: 10,
    position: 'relative',
    maxWidth: '100%'

  },
  productCard: {
    backgroundColor: '#222',
    marginVertical: 5, // Even vertical margin between product cards
    padding: 10,
    borderRadius: 8,
    borderColor: '#333',
    position: 'relative',
    borderWidth: 1,
    marginLeft: 10,
    marginRight: 10,
    flex: 1, // Allows the product card to take up equal width within the row
    width: '100%'
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


export default App;
