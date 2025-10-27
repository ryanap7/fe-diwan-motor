# Edit Cashier Name Feature - POSKasir

## Overview
Fitur untuk mengedit nama kasir yang akan ditampilkan di header POS dan pada struk pembelian.

## Problem Solved
- **Issue**: Nama kasir di struk selalu menampilkan "Admin" meskipun user yang login adalah "Darkam"
- **Root Cause**: Hardcoded fallback ke "Admin" tanpa mengambil data user yang sebenarnya
- **Solution**: Dynamic cashier name dengan edit capability

## Implementation Details

### 1. State Management
```jsx
const [cashierName, setCashierName] = useState('')
const [showCashierDialog, setShowCashierDialog] = useState(false)
```

### 2. User Data Initialization
```jsx
useEffect(() => {
  try {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      
      // Priority: displayName (custom) > name > username > email > Admin
      const userName = userData.displayName || userData.name || userData.username || userData.email || 'Admin';
      setCashierName(userName);
    } else {
      setCashierName('Admin');
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
    setCashierName('Admin');
  }
}, []);
```

### 3. Header Display Enhancement
```jsx
<div className="flex items-center gap-2 mt-1">
  <div className="flex items-center gap-1">
    <User className="w-4 h-4 text-green-600" />
    <span className="text-sm text-green-600 font-medium">
      Halo, {cashierName}
    </span>
  </div>
  <span className="hidden sm:block text-sm text-gray-400">•</span>
  <span className="hidden sm:block text-sm text-gray-600">HD Motopart (CASHIER)</span>
</div>
```

### 4. Settings Button
```jsx
<Button
  onClick={() => setShowCashierDialog(true)}
  size="sm"
  variant="ghost"
  className="p-1 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
  title="Edit Nama Kasir"
>
  <Settings className="w-4 h-4" />
</Button>
```

### 5. Edit Dialog
```jsx
<Dialog open={showCashierDialog} onOpenChange={setShowCashierDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Edit className="w-5 h-5 text-blue-600" />
        Edit Nama Kasir
      </DialogTitle>
    </DialogHeader>
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="cashierName">Nama Kasir</Label>
        <Input
          id="cashierName"
          value={cashierName}
          onChange={(e) => setCashierName(e.target.value)}
          placeholder="Masukkan nama kasir"
          className="w-full"
        />
      </div>
      {/* Info section */}
    </div>
    {/* Action buttons */}
  </DialogContent>
</Dialog>
```

### 6. Receipt Data Update
```jsx 
// Receipt data generation now uses dynamic cashier name
const receiptData = {
  // ... other fields
  cashierName: String(cashierName || 'Admin'),
  // ... rest of fields
};
```

### 7. Persistent Storage
```jsx
// Save custom display name to localStorage
const user = localStorage.getItem("user");
if (user) {
  try {
    const userData = JSON.parse(user);
    userData.displayName = cashierName; // Save custom display name
    localStorage.setItem("user", JSON.stringify(userData));
  } catch (error) {
    console.error("Error saving cashier name:", error);
  }
}
```

## User Flow

### 1. Automatic Name Detection
- System mengambil data user dari localStorage
- Priority order: `displayName` > `name` > `username` > `email` > `Admin`
- Display di header: "Halo, {cashierName}"

### 2. Edit Capability
- User klik icon Settings di sebelah judul "Point of Sale (POS)"
- Dialog edit terbuka dengan current cashier name
- User dapat mengedit nama sesuai keinginan
- Klik "Simpan" untuk update

### 3. Persistence
- Nama tersimpan di `userData.displayName` di localStorage
- Akan digunakan untuk session berikutnya
- Ditampilkan di struk pembelian

### 4. Receipt Integration
- Nama kasir dari state `cashierName` digunakan di receipt data
- Tampil di preview struk dan print RawBT
- Konsisten di semua output

## UI Components

### Header Display
```
Point of Sale (POS) [⚙️]
👤 Halo, Darkam • HD Motopart (CASHIER)
[Bluetooth Status] [RawBT Settings]
```

### Edit Dialog
```
┌─ Edit Nama Kasir ────────────────┐
│ ✏️ Edit Nama Kasir               │
│                                  │
│ Nama Kasir                       │
│ [Darkam              ]           │
│                                  │
│ ℹ️ Info                          │
│ Nama kasir akan ditampilkan di   │
│ struk pembelian dan header POS.  │
│ Pastikan nama sudah benar...     │
│                                  │
│      [Batal]    [Simpan]         │
└──────────────────────────────────┘
```

## Data Flow

### Before Fix
```
localStorage.user.name: "Darkam"
↓
receiptData.cashierName: "Admin" (hardcoded fallback)
↓ 
Struk shows: "Kasir: Admin" ❌
```

### After Fix
```
localStorage.user.name: "Darkam"
↓
cashierName state: "Darkam" (from user data)
↓
receiptData.cashierName: "Darkam" (from state)
↓
Struk shows: "Kasir: Darkam" ✅
```

### With Custom Edit
```
User edits: "Darkam" → "Pak Darkam"
↓
localStorage.user.displayName: "Pak Darkam"
↓
cashierName state: "Pak Darkam"
↓
receiptData.cashierName: "Pak Darkam"
↓
Struk shows: "Kasir: Pak Darkam" ✅
```

## Benefits

### ✅ **Accurate User Display**
- Shows actual logged-in user name instead of hardcoded "Admin"
- Consistent across header and receipt

### ✅ **Customizable Display Name**  
- User can set preferred display name
- Useful for formal names, nicknames, atau titles

### ✅ **Persistent Settings**
- Saved to localStorage
- Remembered across sessions

### ✅ **Professional Receipt**
- Accurate cashier information
- Better audit trail
- Professional appearance

### ✅ **Easy Access**
- Settings icon right in header
- Quick edit without leaving POS
- Intuitive UX

## Technical Notes

### Icons Used
- `Settings` - untuk tombol edit di header
- `Edit` - untuk dialog title  
- `User` - untuk display nama kasir
- `AlertCircle` - untuk info message

### localStorage Structure
```json
{
  "user": {
    "name": "Darkam",
    "email": "darkam@example.com", 
    "role": "CASHIER",
    "displayName": "Pak Darkam"  // Custom name for display
  }
}
```

### Error Handling
- Try-catch untuk JSON parsing
- Fallback ke "Admin" jika ada error
- Console logging untuk debugging

## Testing Scenarios

### 1. Fresh Login
- User "Darkam" login
- Header shows: "Halo, Darkam"
- Receipt shows: "Kasir: Darkam"

### 2. Custom Name
- User edit nama jadi "Pak Darkam" 
- Header shows: "Halo, Pak Darkam"
- Receipt shows: "Kasir: Pak Darkam"

### 3. Session Persistence
- Refresh page
- Custom name masih tersimpan
- Consistent display

### 4. Fallback Handling
- Corrupt user data
- Falls back to "Admin"
- No app crash

Fitur ini menyelesaikan masalah nama kasir yang tidak akurat dan memberikan flexibility untuk customize display name sesuai kebutuhan bisnis.