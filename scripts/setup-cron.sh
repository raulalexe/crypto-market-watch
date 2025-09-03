#!/bin/bash

# Crypto Market Watch - Cron Job Setup Script
# This script helps set up automated data collection via cron jobs

echo "🚀 Setting up Crypto Market Watch data collection cron jobs..."
echo ""

# Get the project directory
PROJECT_DIR=$(pwd)
echo "📁 Project directory: $PROJECT_DIR"

# Check if we're in the right directory
if [ ! -f "scripts/collect-all-data.js" ]; then
    echo "❌ Error: Please run this script from the crypto-market-watch project root directory"
    exit 1
fi

echo "✅ Project directory verified"
echo ""

# Create log directory if it doesn't exist
LOG_DIR="/var/log"
if [ ! -w "$LOG_DIR" ]; then
    echo "⚠️  Warning: Cannot write to $LOG_DIR"
    echo "   Logs will be written to project directory instead"
    LOG_DIR="$PROJECT_DIR/logs"
    mkdir -p "$LOG_DIR"
fi

echo "📝 Log directory: $LOG_DIR"
echo ""

# Function to add cron job
add_cron_job() {
    local schedule="$1"
    local description="$2"
    local command="$3"
    
    echo "📅 Adding cron job: $description"
    echo "   Schedule: $schedule"
    echo "   Command: $command"
    echo ""
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$schedule $command") | crontab -
    
    if [ $? -eq 0 ]; then
        echo "✅ Cron job added successfully"
    else
        echo "❌ Failed to add cron job"
        return 1
    fi
    echo ""
}

# Function to show current cron jobs
show_cron_jobs() {
    echo "📋 Current cron jobs:"
    crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$" || echo "   No cron jobs found"
    echo ""
}

# Function to remove all crypto market watch cron jobs
remove_cron_jobs() {
    echo "🗑️  Removing all Crypto Market Watch cron jobs..."
    crontab -l 2>/dev/null | grep -v "crypto-market-watch" | crontab -
    echo "✅ All Crypto Market Watch cron jobs removed"
    echo ""
}

# Main menu
while true; do
    echo "🔧 Cron Job Setup Menu:"
    echo "1. Add daily data collection (9:00 AM UTC)"
    echo "2. Add 4-hourly data collection"
    echo "3. Add market hours collection (weekdays, 9 AM - 5 PM UTC)"
    echo "4. Add custom schedule"
    echo "5. Show current cron jobs"
    echo "6. Remove all Crypto Market Watch cron jobs"
    echo "7. Test data collection script"
    echo "8. Exit"
    echo ""
    read -p "Choose an option (1-8): " choice
    
    case $choice in
        1)
            # Daily at 9:00 AM UTC
            add_cron_job "0 9 * * *" "Daily data collection" "cd $PROJECT_DIR && node scripts/collect-all-data.js >> $LOG_DIR/crypto-data-collection.log 2>&1"
            ;;
        2)
            # Every 4 hours
            add_cron_job "0 */4 * * *" "4-hourly data collection" "cd $PROJECT_DIR && node scripts/collect-all-data.js >> $LOG_DIR/crypto-data-collection.log 2>&1"
            ;;
        3)
            # Market hours (weekdays, 9 AM - 5 PM UTC)
            add_cron_job "0 9-17 * * 1-5" "Market hours collection" "cd $PROJECT_DIR && node scripts/collect-all-data.js >> $LOG_DIR/crypto-data-collection.log 2>&1"
            ;;
        4)
            # Custom schedule
            echo "📅 Custom cron schedule examples:"
            echo "   Every hour: 0 * * * *"
            echo "   Every 30 minutes: */30 * * * *"
            echo "   Twice daily: 0 9,18 * * *"
            echo "   Weekends only: 0 10 * * 6,0"
            echo ""
            read -p "Enter cron schedule (e.g., '0 */2 * * *' for every 2 hours): " custom_schedule
            read -p "Enter description: " custom_description
            
            if [ -n "$custom_schedule" ] && [ -n "$custom_description" ]; then
                add_cron_job "$custom_schedule" "$custom_description" "cd $PROJECT_DIR && node scripts/collect-all-data.js >> $LOG_DIR/crypto-data-collection.log 2>&1"
            else
                echo "❌ Invalid input"
            fi
            ;;
        5)
            show_cron_jobs
            ;;
        6)
            remove_cron_jobs
            ;;
        7)
            echo "🧪 Testing data collection script..."
            echo "   This will run a full data collection cycle"
            echo "   Press Ctrl+C to stop if needed"
            echo ""
            read -p "Press Enter to continue or Ctrl+C to cancel..."
            node scripts/collect-all-data.js
            ;;
        8)
            echo "👋 Setup complete! Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please choose 1-8."
            echo ""
            ;;
    esac
    
    echo "Press Enter to continue..."
    read
    echo ""
done
