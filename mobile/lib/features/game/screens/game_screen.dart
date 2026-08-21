import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../config/theme.dart';

class GameScreen extends StatefulWidget {
  final String gameId;
  const GameScreen({Key? key, required this.gameId}) : super(key: key);

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  int diceValue = 0;
  bool isRolling = false;
  int currentTurnPlayerId = 1; // Demo
  int myPlayerId = 1; // Demo

  void _rollDice() {
    setState(() => isRolling = true);
    Future.delayed(Duration(seconds: 1), () {
      setState(() {
        diceValue = DateTime.now().microsecond % 6 + 1;
        isRolling = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final isMyTurn = currentTurnPlayerId == myPlayerId;

    return Scaffold(
      appBar: AppBar(
        title: Text('Game ${widget.gameId}', style: TextStyle(fontSize: 18.sp)),
        actions: [
          Padding(
            padding: EdgeInsets.all(16.w),
            child: Center(
              child: Text('Game Level: 1,000', style: TextStyle(fontSize: 14.sp)),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Game Board
          Expanded(
            child: Container(
              color: AppColors.gray100,
              child: Center(
                child: Container(
                  width: 300.w,
                  height: 300.w,
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    border: Border.all(color: AppColors.primary, width: 2),
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Ludo Game Board',
                        style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w600),
                      ),
                      SizedBox(height: 20.h),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _buildPieceContainer('RED', AppColors.red),
                          _buildPieceContainer('BLUE', AppColors.blue),
                          _buildPieceContainer('GREEN', AppColors.green),
                          _buildPieceContainer('YELLOW', AppColors.yellow),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // Dice and Controls
          Container(
            padding: EdgeInsets.all(20.w),
            decoration: BoxDecoration(
              color: AppColors.white,
              border: Border(
                top: BorderSide(color: AppColors.gray200),
              ),
            ),
            child: Column(
              children: [
                // Status
                Text(
                  isMyTurn ? '🎮 Your Turn' : '⏳ Opponent\'s Turn',
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w600,
                    color: isMyTurn ? AppColors.success : AppColors.warning,
                  ),
                ),
                SizedBox(height: 16.h),
                // Dice
                GestureDetector(
                  onTap: isMyTurn && !isRolling ? _rollDice : null,
                  child: Container(
                    width: 80.w,
                    height: 80.w,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(8.r),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 8,
                          offset: Offset(0, 2.h),
                        )
                      ],
                    ),
                    child: Center(
                      child: isRolling
                          ? SizedBox(
                              width: 30.w,
                              height: 30.w,
                              child: const CircularProgressIndicator(
                                color: AppColors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              diceValue > 0 ? diceValue.toString() : '?',
                              style: TextStyle(
                                fontSize: 32.sp,
                                fontWeight: FontWeight.w700,
                                color: AppColors.white,
                              ),
                            ),
                    ),
                  ),
                ),
                SizedBox(height: 16.h),
                Text(
                  isMyTurn && !isRolling ? 'Tap dice to roll' : diceValue > 0 ? 'Move your piece' : 'Waiting for turn',
                  style: TextStyle(fontSize: 12.sp, color: AppColors.gray400),
                ),
                SizedBox(height: 20.h),
                // Forfeit Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: Text('Forfeit Game?'),
                          content: Text('You will lose your entry coins.'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel')),
                            TextButton(
                              onPressed: () {
                                Navigator.pop(context);
                                Navigator.pop(context);
                              },
                              child: Text('Forfeit', style: TextStyle(color: AppColors.error)),
                            ),
                          ],
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.error.withOpacity(0.1),
                      foregroundColor: AppColors.error,
                    ),
                    child: Text('Forfeit Game', style: TextStyle(fontSize: 14.sp)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPieceContainer(String color, Color bgColor) {
    return Column(
      children: [
        Container(
          width: 40.w,
          height: 40.w,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(8.r),
          ),
          child: Center(
            child: Text('●', style: TextStyle(color: AppColors.white, fontSize: 20.sp)),
          ),
        ),
        SizedBox(height: 4.h),
        Text(color, style: TextStyle(fontSize: 10.sp, color: AppColors.gray400)),
      ],
    );
  }
}
