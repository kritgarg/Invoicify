import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/currency';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  companyName: { fontSize: 24, fontWeight: 'bold' },
  invoiceTitle: { fontSize: 20, color: '#4B5563' },
  detailsSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, color: '#6B7280' },
  text: { fontSize: 10, marginBottom: 3 },
  table: { width: '100%', marginBottom: 30 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 5, marginBottom: 5 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  colDesc: { width: '50%', fontSize: 10 },
  colQty: { width: '15%', fontSize: 10, textAlign: 'right' },
  colPrice: { width: '15%', fontSize: 10, textAlign: 'right' },
  colTotal: { width: '20%', fontSize: 10, textAlign: 'right' },
  colTextHead: { fontSize: 10, fontWeight: 'bold', color: '#374151' },
  totalsSection: { width: '40%', alignSelf: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  totalText: { fontSize: 10 },
  totalAmountText: { fontSize: 12, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10 }
});

const QuotePDF = ({ quote, organization }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>{organization?.name || 'Company Name'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.invoiceTitle}>QUOTATION</Text>
          <Text style={styles.text}>#{quote?.id?.slice(-6).toUpperCase()}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsSection}>
        <View>
          <Text style={styles.sectionTitle}>PREPARED FOR:</Text>
          <Text style={styles.text}>{quote?.customer?.name}</Text>
          {quote?.customer?.email && <Text style={styles.text}>{quote.customer.email}</Text>}
          {quote?.customer?.address && <Text style={styles.text}>{quote.customer.address}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ ...styles.text, color: '#6B7280', marginRight: 10 }}>Issue Date:</Text>
            <Text style={styles.text}>{quote?.issueDate && new Date(quote.issueDate).toLocaleDateString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ ...styles.text, color: '#6B7280', marginRight: 10 }}>Valid Until:</Text>
            <Text style={styles.text}>{quote?.expiryDate ? new Date(quote.expiryDate).toLocaleDateString() : 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Table Item Header */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, styles.colTextHead]}>Description</Text>
          <Text style={[styles.colQty, styles.colTextHead]}>Qty</Text>
          <Text style={[styles.colPrice, styles.colTextHead]}>Rate</Text>
          <Text style={[styles.colTotal, styles.colTextHead]}>Total</Text>
        </View>
        
        {quote?.items?.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{formatCurrency(item.rate, organization?.currency)}</Text>
            <Text style={styles.colTotal}>{formatCurrency(item.total, organization?.currency)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Subtotal:</Text>
          <Text style={styles.totalText}>{formatCurrency(quote?.subtotal, organization?.currency)}</Text>
        </View>
        {quote?.tax > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Tax:</Text>
            <Text style={styles.totalText}>{formatCurrency(quote?.tax, organization?.currency)}</Text>
          </View>
        )}
        <View style={[styles.totalRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
          <Text style={{ ...styles.totalText, fontWeight: 'bold' }}>Total:</Text>
          <Text style={styles.totalAmountText}>{formatCurrency(quote?.total, organization?.currency)}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for considering our proposal. We look forward to doing business with you.</Text>
      </View>

    </Page>
  </Document>
);

export default QuotePDF;
