// mock-data.js
window.MOCK_DATA = {
  users: {
    hq: [
      { id:'admin', name:'Arjun Mehta', password:'hq@2024', role:'hq', title:'Chief Executive Officer', email:'arjun.mehta@netbankx.com', phone:'+91-11-4000-0001', avatar:'AM' }
    ],
    regional: [
      { id:'raj.sharma', name:'Raj Sharma', password:'reg@2024', role:'regional', regionId:'MH', state:'Maharashtra', title:'Regional Head - Maharashtra', email:'raj.sharma@netbankx.com', avatar:'RS' },
      { id:'priya.patel', name:'Priya Patel', password:'reg@2024', role:'regional', regionId:'DL', state:'Delhi', title:'Regional Head - Delhi', email:'priya.patel@netbankx.com', avatar:'PP' },
      { id:'suresh.kumar', name:'Suresh Kumar', password:'reg@2024', role:'regional', regionId:'KA', state:'Karnataka', title:'Regional Head - Karnataka', email:'suresh.kumar@netbankx.com', avatar:'SK' }
    ],
    branch: [
      { id:'MH-MUM-001-MGR', name:'Vikram Nair', password:'branch@2024', role:'branch', branchId:'MH-MUM-001', regionId:'MH' },
      { id:'MH-MUM-002-MGR', name:'Anita Desai', password:'branch@2024', role:'branch', branchId:'MH-MUM-002', regionId:'MH' },
      { id:'MH-PUN-001-MGR', name:'Rohit Joshi', password:'branch@2024', role:'branch', branchId:'MH-PUN-001', regionId:'MH' },
      { id:'MH-NGP-001-MGR', name:'Kavita Raut', password:'branch@2024', role:'branch', branchId:'MH-NGP-001', regionId:'MH' },
      { id:'DL-NDL-001-MGR', name:'Amit Verma', password:'branch@2024', role:'branch', branchId:'DL-NDL-001', regionId:'DL' },
      { id:'DL-NDL-002-MGR', name:'Neha Gupta', password:'branch@2024', role:'branch', branchId:'DL-NDL-002', regionId:'DL' },
      { id:'DL-GGN-001-MGR', name:'Sanjay Yadav', password:'branch@2024', role:'branch', branchId:'DL-GGN-001', regionId:'DL' },
      { id:'KA-BLR-001-MGR', name:'Deepa Iyer', password:'branch@2024', role:'branch', branchId:'KA-BLR-001', regionId:'KA' },
      { id:'KA-BLR-002-MGR', name:'Kiran Rao', password:'branch@2024', role:'branch', branchId:'KA-BLR-002', regionId:'KA' },
      { id:'KA-MYS-001-MGR', name:'Meera Bhat', password:'branch@2024', role:'branch', branchId:'KA-MYS-001', regionId:'KA' }
    ],
    customers: [
      { id:'ACC-100001', name:'Aisha Kapoor', password:'cust@2024', role:'customer', branchId:'MH-MUM-001', regionId:'MH', accountType:'Savings', balance:125000, phone:'9876543210', email:'aisha.k@email.com', address:'Bandra, Mumbai', dob:'1990-05-15', kycStatus:'verified', joinDate:'2020-01-10', avatar:'AK' },
      { id:'ACC-100002', name:'Ravi Menon', password:'cust@2024', role:'customer', branchId:'MH-MUM-001', regionId:'MH', accountType:'Current', balance:87500, phone:'9876543211', email:'ravi.m@email.com', address:'Andheri, Mumbai', dob:'1985-11-22', kycStatus:'verified', joinDate:'2021-03-20', avatar:'RM' },
      { id:'ACC-100003', name:'Sneha Reddy', password:'cust@2024', role:'customer', branchId:'KA-BLR-001', regionId:'KA', accountType:'Savings', balance:234000, phone:'9876543212', email:'sneha.r@email.com', address:'Koramangala, BLR', dob:'1992-08-30', kycStatus:'verified', joinDate:'2019-11-05', avatar:'SR' },
      { id:'ACC-100004', name:'Karan Singh', password:'cust@2024', role:'customer', branchId:'DL-NDL-001', regionId:'DL', accountType:'Savings', balance:45000, phone:'9876543213', email:'karan.s@email.com', address:'CP, Delhi', dob:'1988-02-14', kycStatus:'verified', joinDate:'2022-06-15', avatar:'KS' },
      { id:'ACC-100005', name:'Pooja Sharma', password:'cust@2024', role:'customer', branchId:'MH-PUN-001', regionId:'MH', accountType:'Savings', balance:320000, phone:'9876543214', email:'pooja.s@email.com', address:'Viman Nagar, Pune', dob:'1995-09-10', kycStatus:'verified', joinDate:'2023-01-25', avatar:'PS' },
      { id:'ACC-100006', name:'Vikram Das', password:'cust@2024', role:'customer', branchId:'KA-MYS-001', regionId:'KA', accountType:'Current', balance:550000, phone:'9876543215', email:'vikram.d@email.com', address:'Gokulam, Mysore', dob:'1980-12-01', kycStatus:'verified', joinDate:'2018-04-12', avatar:'VD' },
      { id:'ACC-100007', name:'Neha Gupta', password:'cust@2024', role:'customer', branchId:'DL-GGN-001', regionId:'DL', accountType:'Savings', balance:15000, phone:'9876543216', email:'neha.g@email.com', address:'Cyber City, Gurgaon', dob:'1998-07-20', kycStatus:'verified', joinDate:'2023-11-30', avatar:'NG' },
      { id:'ACC-100008', name:'Rahul Verma', password:'cust@2024', role:'customer', branchId:'MH-MUM-002', regionId:'MH', accountType:'Savings', balance:95000, phone:'9876543217', email:'rahul.v@email.com', address:'Borivali, Mumbai', dob:'1991-03-25', kycStatus:'verified', joinDate:'2021-08-18', avatar:'RV' },
      { id:'ACC-100009', name:'Anjali Desai', password:'cust@2024', role:'customer', branchId:'KA-BLR-002', regionId:'KA', accountType:'Savings', balance:210000, phone:'9876543218', email:'anjali.d@email.com', address:'Whitefield, BLR', dob:'1987-06-08', kycStatus:'verified', joinDate:'2020-09-14', avatar:'AD' },
      { id:'ACC-100010', name:'Sanjay Patil', password:'cust@2024', role:'customer', branchId:'MH-NGP-001', regionId:'MH', accountType:'Current', balance:420000, phone:'9876543219', email:'sanjay.p@email.com', address:'Dharampeth, Nagpur', dob:'1975-10-12', kycStatus:'verified', joinDate:'2015-02-28', avatar:'SP' },
      { id:'ACC-100011', name:'Megha Joshi', password:'cust@2024', role:'customer', branchId:'DL-NDL-002', regionId:'DL', accountType:'Savings', balance:78000, phone:'9876543220', email:'megha.j@email.com', address:'South Ex, Delhi', dob:'1993-04-05', kycStatus:'verified', joinDate:'2022-01-11', avatar:'MJ' },
      { id:'ACC-100012', name:'Amit Kumar', password:'cust@2024', role:'customer', branchId:'KA-BLR-001', regionId:'KA', accountType:'Savings', balance:35000, phone:'9876543221', email:'amit.k@email.com', address:'Indiranagar, BLR', dob:'1996-11-18', kycStatus:'verified', joinDate:'2023-05-22', avatar:'AK' },
      { id:'ACC-100013', name:'Kavita Iyer', password:'cust@2024', role:'customer', branchId:'MH-PUN-001', regionId:'MH', accountType:'Savings', balance:185000, phone:'9876543222', email:'kavita.i@email.com', address:'Kothrud, Pune', dob:'1989-01-30', kycStatus:'verified', joinDate:'2019-07-07', avatar:'KI' },
      { id:'ACC-100014', name:'Deepak Rao', password:'cust@2024', role:'customer', branchId:'DL-GGN-001', regionId:'DL', accountType:'Current', balance:275000, phone:'9876543223', email:'deepak.r@email.com', address:'DLF Phase 3, Gurgaon', dob:'1982-08-14', kycStatus:'verified', joinDate:'2017-10-09', avatar:'DR' },
      { id:'ACC-100015', name:'Sonia Bhat', password:'cust@2024', role:'customer', branchId:'MH-MUM-001', regionId:'MH', accountType:'Savings', balance:62000, phone:'9876543224', email:'sonia.b@email.com', address:'Dadar, Mumbai', dob:'1994-02-26', kycStatus:'verified', joinDate:'2021-12-03', avatar:'SB' }
    ]
  },
  regions: [
    { id:'MH', name:'Maharashtra Regional Office', city:'Mumbai', state:'Maharashtra', head:'Raj Sharma', headId:'raj.sharma', branches:['MH-MUM-001','MH-MUM-002','MH-PUN-001','MH-NGP-001'], established:'2010', contact:'+91-22-4000-1000', status:'active' },
    { id:'DL', name:'Delhi Regional Office', city:'New Delhi', state:'Delhi', head:'Priya Patel', headId:'priya.patel', branches:['DL-NDL-001','DL-NDL-002','DL-GGN-001'], established:'2011', contact:'+91-11-4000-2000', status:'active' },
    { id:'KA', name:'Karnataka Regional Office', city:'Bengaluru', state:'Karnataka', head:'Suresh Kumar', headId:'suresh.kumar', branches:['KA-BLR-001','KA-BLR-002','KA-MYS-001'], established:'2012', contact:'+91-80-4000-3000', status:'active' }
  ],
  branches: [
    { id:'MH-MUM-001', name:'Mumbai Main', regionId:'MH', city:'Mumbai', state:'Maharashtra', manager:'Vikram Nair', managerId:'MH-MUM-001-MGR', address:'Nariman Point', phone:'022-22001111', ifsc:'NBXX0000001', customerCount:4520, status:'active', established:'2010' },
    { id:'MH-MUM-002', name:'Mumbai West', regionId:'MH', city:'Mumbai', state:'Maharashtra', manager:'Anita Desai', managerId:'MH-MUM-002-MGR', address:'Andheri West', phone:'022-22002222', ifsc:'NBXX0000002', customerCount:3100, status:'active', established:'2012' },
    { id:'MH-PUN-001', name:'Pune Central', regionId:'MH', city:'Pune', state:'Maharashtra', manager:'Rohit Joshi', managerId:'MH-PUN-001-MGR', address:'Shivaji Nagar', phone:'020-25001111', ifsc:'NBXX0000003', customerCount:2850, status:'active', established:'2011' },
    { id:'MH-NGP-001', name:'Nagpur', regionId:'MH', city:'Nagpur', state:'Maharashtra', manager:'Kavita Raut', managerId:'MH-NGP-001-MGR', address:'Sitabuldi', phone:'0712-25001111', ifsc:'NBXX0000004', customerCount:1900, status:'active', established:'2014' },
    { id:'DL-NDL-001', name:'Connaught Place', regionId:'DL', city:'New Delhi', state:'Delhi', manager:'Amit Verma', managerId:'DL-NDL-001-MGR', address:'Inner Circle', phone:'011-23001111', ifsc:'NBXX0000005', customerCount:3800, status:'active', established:'2011' },
    { id:'DL-NDL-002', name:'South Delhi', regionId:'DL', city:'New Delhi', state:'Delhi', manager:'Neha Gupta', managerId:'DL-NDL-002-MGR', address:'Hauz Khas', phone:'011-23002222', ifsc:'NBXX0000006', customerCount:2400, status:'active', established:'2013' },
    { id:'DL-GGN-001', name:'Gurgaon', regionId:'DL', city:'Gurgaon', state:'Haryana', manager:'Sanjay Yadav', managerId:'DL-GGN-001-MGR', address:'Cyber Hub', phone:'0124-23001111', ifsc:'NBXX0000007', customerCount:4100, status:'active', established:'2012' },
    { id:'KA-BLR-001', name:'Koramangala', regionId:'KA', city:'Bengaluru', state:'Karnataka', manager:'Deepa Iyer', managerId:'KA-BLR-001-MGR', address:'80ft Road', phone:'080-25001111', ifsc:'NBXX0000008', customerCount:3600, status:'active', established:'2012' },
    { id:'KA-BLR-002', name:'Whitefield', regionId:'KA', city:'Bengaluru', state:'Karnataka', manager:'Kiran Rao', managerId:'KA-BLR-002-MGR', address:'ITPL Main Rd', phone:'080-25002222', ifsc:'NBXX0000009', customerCount:2900, status:'active', established:'2014' },
    { id:'KA-MYS-001', name:'Mysore', regionId:'KA', city:'Mysore', state:'Karnataka', manager:'Meera Bhat', managerId:'KA-MYS-001-MGR', address:'Devaraja Mohalla', phone:'0821-25001111', ifsc:'NBXX0000010', customerCount:1500, status:'active', established:'2015' }
  ],
  transactions: (function(){
    const branches=[
      {id:'MH-MUM-001',rId:'MH',hub:'MH-HUB',rt:'MH-MUM-001-RT'},
      {id:'MH-MUM-002',rId:'MH',hub:'MH-HUB',rt:'MH-MUM-002-RT'},
      {id:'MH-PUN-001',rId:'MH',hub:'MH-HUB',rt:'MH-PUN-001-RT'},
      {id:'MH-NGP-001',rId:'MH',hub:'MH-HUB',rt:'MH-NGP-001-RT'},
      {id:'DL-NDL-001',rId:'DL',hub:'DL-HUB',rt:'DL-NDL-001-RT'},
      {id:'DL-NDL-002',rId:'DL',hub:'DL-HUB',rt:'DL-NDL-002-RT'},
      {id:'DL-GGN-001',rId:'DL',hub:'DL-HUB',rt:'DL-GGN-001-RT'},
      {id:'KA-BLR-001',rId:'KA',hub:'KA-HUB',rt:'KA-BLR-001-RT'},
      {id:'KA-BLR-002',rId:'KA',hub:'KA-HUB',rt:'KA-BLR-002-RT'},
      {id:'KA-MYS-001',rId:'KA',hub:'KA-HUB',rt:'KA-MYS-001-RT'}
    ];
    const descs=['Online Transfer','Salary Credit','Rent Payment','EMI Debit','ATM Withdrawal','UPI Payment','NEFT Transfer','Utility Bill','Insurance Premium','Dividend Credit'];
    const custNames=['Aisha Kapoor','Ravi Menon','Sneha Reddy','Karan Singh','Pooja Sharma','Vikram Das','Neha Gupta','Rahul Verma','Anjali Desai','Sanjay Patil','Megha Joshi','Amit Kumar','Kavita Iyer','Deepak Rao','Sonia Bhat'];
    return Array.from({length:50},(_,i)=>{
      const b=branches[Math.floor(Math.random()*branches.length)];
      const type=['credit','debit','transfer'][Math.floor(Math.random()*3)];
      const fromIdx=Math.floor(Math.random()*15);
      const toIdx=Math.floor(Math.random()*15);
      return{
        id:'TXN-'+Math.random().toString(36).substr(2,8).toUpperCase(),
        date:new Date(Date.now()-Math.floor(Math.random()*10000000000)).toISOString(),
        type,
        amount:Math.floor(Math.random()*50000)+100,
        fromAccount:type==='credit'?'EXTERNAL':`ACC-${100001+fromIdx}`,
        toAccount:type==='debit'?'EXTERNAL':`ACC-${100001+toIdx}`,
        fromName:type==='credit'?'External Source':custNames[fromIdx],
        toName:type==='debit'?'External Payee':custNames[toIdx],
        description:descs[i%descs.length],
        status:Math.random()>0.1?'completed':(Math.random()>0.5?'pending':'failed'),
        branchId:b.id,
        regionId:b.rId,
        networkPath:['HQ',b.hub,b.rt],
        latencyMs:Math.floor(Math.random()*50)+10,
        packetsSent:Math.floor(Math.random()*8)+2,
        packetsReceived:Math.floor(Math.random()*8)+2
      };
    });
  })(),
  serviceRequests: (function(){
    const names=['Aisha Kapoor','Ravi Menon','Sneha Reddy','Karan Singh','Pooja Sharma','Vikram Das','Neha Gupta','Rahul Verma','Anjali Desai','Sanjay Patil'];
    const bids=['MH-MUM-001','MH-MUM-001','KA-BLR-001','DL-NDL-001','MH-PUN-001','KA-MYS-001','DL-GGN-001','MH-MUM-002','KA-BLR-002','MH-NGP-001'];
    const rids=['MH','MH','KA','DL','MH','KA','DL','MH','KA','MH'];
    const types=['cheque_book','debit_card','statement','loan_inquiry','address_change','cheque_book','debit_card','statement','loan_inquiry','address_change'];
    const details=['New cheque book for savings account','Card damaged, need replacement','Last 6 months account statement','Home loan inquiry - 30L','Address updated to new flat','2nd cheque book request','ATM card blocked, need new one','Statement for income tax filing','Personal loan - 5L','Name change after marriage'];
    return Array.from({length:10},(_,i)=>({
      id:`REQ-${10000+i}`,
      customerId:`ACC-${100001+i}`,
      customerName:names[i],
      type:types[i],
      status:['pending','processing','completed'][Math.floor(Math.random()*3)],
      submittedDate:new Date(Date.now()-Math.floor(Math.random()*2000000000)).toISOString(),
      branchId:bids[i],
      regionId:rids[i],
      details:details[i]
    }));
  })(),
  networkTopology: {
    nodes: [
      { id:'HQ', label:'HQ Server', type:'hq', x:500, y:80 },
      { id:'MH-HUB', label:'MH Regional Hub', type:'regional', x:200, y:220, regionId:'MH' },
      { id:'DL-HUB', label:'DL Regional Hub', type:'regional', x:500, y:220, regionId:'DL' },
      { id:'KA-HUB', label:'KA Regional Hub', type:'regional', x:800, y:220, regionId:'KA' },
      { id:'MH-MUM-001-RT', label:'Mumbai Main Router', type:'branch', x:100, y:380, regionId:'MH', branchId:'MH-MUM-001' },
      { id:'MH-MUM-002-RT', label:'Mumbai West Router', type:'branch', x:200, y:380, regionId:'MH', branchId:'MH-MUM-002' },
      { id:'MH-PUN-001-RT', label:'Pune Router', type:'branch', x:300, y:380, regionId:'MH', branchId:'MH-PUN-001' }
    ],
    links: [
      { from:'HQ', to:'MH-HUB', bandwidth:1000, latency:5 },
      { from:'HQ', to:'DL-HUB', bandwidth:1000, latency:3 },
      { from:'HQ', to:'KA-HUB', bandwidth:1000, latency:8 },
      { from:'MH-HUB', to:'MH-MUM-001-RT', bandwidth:100, latency:2 },
      { from:'MH-HUB', to:'MH-MUM-002-RT', bandwidth:100, latency:2 },
      { from:'MH-HUB', to:'MH-PUN-001-RT', bandwidth:100, latency:3 }
    ]
  }
};

