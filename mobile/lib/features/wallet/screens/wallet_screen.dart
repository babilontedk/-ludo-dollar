import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../config/theme.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({Key? key}) : super(key: key);

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  int availableCoins = 50000;
  int lockedCoins = 0;
  int bonusCoins = 5000;

  @override
  Widget build(BuildContext context) {
    final totalCoins = availableCoins + lockedCoins + bonusCoins;

    return Scaffold(
      appBar: AppBar(
        title: Text('Wallet', style: TextStyle(fontSize: 20.sp, fontWeight: FontWeight.w600)),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 20.h),
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.all(24.w),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16.r),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 10,
                    offset: Offset(0, 4.h),
                  )
                ],
              ),
              child: Column(
                children: [
                  Text(
                    'Total Balance',
                    style: TextStyle(color: AppColors.white.withOpacity(0.8), fontSize: 14.sp),
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    '₦${totalCoins.toString()}',
                    style: TextStyle(
                      color: AppColors.white,
                      fontSize: 36.sp,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(height: 20.h),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildCoinType('Available', availableCoins, AppColors.success),
                      _buildCoinType('Locked', lockedCoins, AppColors.warning),
                      _buildCoinType('Bonus', bonusCoins, AppColors.accent),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(height: 32.h),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    icon: Icon(Icons.add_circle_outline, size: 20.sp),
                    label: Text('Deposit', style: TextStyle(fontSize: 14.sp)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.success,
                      padding: EdgeInsets.symmetric(vertical: 12.h),
                    ),
                  ),
                ),
                SizedBox(width: 16.w),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    icon: Icon(Icons.remove_circle_outline, size: 20.sp),
                    label: Text('Withdraw', style: TextStyle(fontSize: 14.sp)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.error,
                      padding: EdgeInsets.symmetric(vertical: 12.h),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 32.h),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Recent Transactions',
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w600),
              ),
            ),
            SizedBox(height: 16.h),
            _buildTransactionItem('Game Entry', '-1,000', DateTime.now(), AppColors.error),
            _buildTransactionItem('Game Winning', '+2,500', DateTime.now().subtract(Duration(hours: 1)), AppColors.success),
            _buildTransactionItem('Deposit', '+5,000', DateTime.now().subtract(Duration(days: 1)), AppColors.success),
            _buildTransactionItem('Bonus', '+500', DateTime.now().subtract(Duration(days: 2)), AppColors.warning),
          ],
        ),
      ),
    );
  }

  Widget _buildCoinType(String label, int amount, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(color: AppColors.white.withOpacity(0.7), fontSize: 12.sp),
        ),
        SizedBox(height: 4.h),
        Text(
          amount.toString(),
          style: TextStyle(color: AppColors.white, fontSize: 16.sp, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  Widget _buildTransactionItem(String type, String amount, DateTime date, Color amountColor) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 16.w),
      margin: EdgeInsets.only(bottom: 12.h),
      decoration: BoxDecoration(
        color: AppColors.gray100,
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(type, style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600)),
              SizedBox(height: 4.h),
              Text(
                '${date.hour}:${date.minute.toString().padLeft(2, '0')}',
                style: TextStyle(fontSize: 12.sp, color: AppColors.gray400),
              ),
            ],
          ),
          Text(
            amount,
            style: TextStyle(
              fontSize: 14.sp,
              fontWeight: FontWeight.w600,
              color: amountColor,
            ),
          ),
        ],
      ),
    );
  }
}
