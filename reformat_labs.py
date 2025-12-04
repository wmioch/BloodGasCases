import pandas as pd
import numpy as np

try:
    import vitaldb
    VITALDB_AVAILABLE = True
except ImportError:
    print("Warning: vitaldb library not found. Install it with: pip install vitaldb")
    print("Continuing without FiO2 data...")
    VITALDB_AVAILABLE = False

# Read the CSV file
print("Reading labs.csv...")
df = pd.read_csv('labs.csv')

# Get unique caseids and their lab timestamps
print("Extracting case IDs and timestamps...")
unique_lab_times = df[['caseid', 'dt']].drop_duplicates().sort_values(['caseid', 'dt'])

# Fetch FiO2 data if vitaldb is available
fio2_data = None
if VITALDB_AVAILABLE:
    print("\nFetching FiO2 data from VitalDB...")
    
    # Try FiO2 track names from VitalDB documentation
    # According to VitalDB docs: Solar8000/FIO2 and Primus/FIO2 are the correct track names
    fio2_track_names = ['Solar8000/FIO2', 'Primus/FIO2']
    
    case_ids = unique_lab_times['caseid'].unique()
    print(f"Found {len(case_ids)} unique cases")
    
    all_fio2_data = []
    successful_track = None
    
    # Try each track name until we find one that works
    for track_name in fio2_track_names:
        print(f"Trying track name: {track_name}...")
        track_found = False
        
        for case_id in case_ids[:5]:  # Test on first 5 cases
            try:
                case_data = vitaldb.read_numeric_data(case_id, [track_name])
                if case_data is not None and not case_data.empty:
                    track_found = True
                    break
            except Exception as e:
                continue
        
        if track_found:
            successful_track = track_name
            print(f"Found FiO2 track: {track_name}")
            break
    
    if successful_track:
        print(f"Fetching FiO2 data for all cases using track: {successful_track}...")
        for idx, case_id in enumerate(case_ids):
            if (idx + 1) % 100 == 0:
                print(f"  Processed {idx + 1}/{len(case_ids)} cases...")
            
            try:
                case_data = vitaldb.read_numeric_data(case_id, [successful_track])
                if case_data is not None and not case_data.empty:
                    # Rename columns to match our format
                    case_data = case_data.rename(columns={'Time': 'dt', 'Value': 'FiO2'})
                    case_data['caseid'] = case_id
                    all_fio2_data.append(case_data)
            except Exception as e:
                # Skip cases where FiO2 data is not available
                continue
        
        if all_fio2_data:
            fio2_data = pd.concat(all_fio2_data, ignore_index=True)
            print(f"Successfully fetched FiO2 data for {len(fio2_data['caseid'].unique())} cases")
            print(f"Total FiO2 data points: {len(fio2_data)}")
        else:
            print("Warning: No FiO2 data could be fetched")
    else:
        print("Warning: Could not find FiO2 track. Available tracks may differ.")
        print("You may need to check VitalDB documentation for the correct track name.")

# Merge FiO2 data with lab timestamps using nearest neighbor matching
if fio2_data is not None and not fio2_data.empty:
    print("\nMatching FiO2 values to lab timestamps...")
    
    # Sort both dataframes for merge_asof (requires sorted data)
    fio2_sorted = fio2_data.sort_values(['caseid', 'dt']).reset_index(drop=True)
    lab_times_sorted = unique_lab_times.sort_values(['caseid', 'dt']).reset_index(drop=True)
    
    # Use merge_asof for efficient nearest neighbor matching
    # This finds the nearest FiO2 value in time for each lab timestamp within the same caseid
    # Note: dt appears to be in seconds, so we use numeric tolerance
    fio2_matched = pd.merge_asof(
        lab_times_sorted,
        fio2_sorted[['caseid', 'dt', 'FiO2']],
        on='dt',
        by='caseid',
        direction='nearest',
        tolerance=3600  # Allow up to 1 hour (3600 seconds) difference
    )
    
    print(f"Matched FiO2 values for {fio2_matched['FiO2'].notna().sum()} out of {len(fio2_matched)} lab timestamps")
    
    # Merge FiO2 into the original lab data
    df = df.merge(fio2_matched[['caseid', 'dt', 'FiO2']], on=['caseid', 'dt'], how='left')
    print("FiO2 values merged into lab data")
else:
    print("\nNo FiO2 data available - continuing without FiO2 column")
    fio2_matched = None

# Pivot the data: caseid and dt become index, name becomes columns, result becomes values
print("\nPivoting data...")
pivoted = df.pivot_table(
    index=['caseid', 'dt'],
    columns='name',
    values='result',
    aggfunc='first'  # Use first value if there are duplicates (shouldn't be, but just in case)
)

# Reset index to make caseid and dt regular columns
pivoted = pivoted.reset_index()

# Add FiO2 column if available (it should be the same for all rows with same caseid/dt)
# Note: FiO2 was merged into df before pivoting, but pivot_table doesn't preserve non-index/column/value columns
# So we need to merge it separately after pivoting
if fio2_data is not None and not fio2_data.empty and fio2_matched is not None and not fio2_matched.empty:
    fio2_for_pivot = fio2_matched[['caseid', 'dt', 'FiO2']].drop_duplicates()
    pivoted = pivoted.merge(fio2_for_pivot, on=['caseid', 'dt'], how='left')
    print("FiO2 column added to pivoted data")

# Sort by caseid and dt for easier reading
pivoted = pivoted.sort_values(['caseid', 'dt'])

# Save to new CSV file
output_file = 'labs_reformatted.csv'
print(f"\nWriting reformatted data to {output_file}...")
pivoted.to_csv(output_file, index=False)

print(f"Done! Reformatted data saved to {output_file}")
print(f"Original shape: {df.shape}")
print(f"Reformatted shape: {pivoted.shape}")
print(f"\nColumns in output: {list(pivoted.columns)}")
print(f"\nFirst few rows:")
print(pivoted.head(10))

# Show FiO2 statistics if available
if 'FiO2' in pivoted.columns:
    print(f"\nFiO2 statistics:")
    print(f"  Non-null values: {pivoted['FiO2'].notna().sum()} / {len(pivoted)}")
    print(f"  Mean FiO2: {pivoted['FiO2'].mean():.2f}")
    print(f"  Min FiO2: {pivoted['FiO2'].min():.2f}")
    print(f"  Max FiO2: {pivoted['FiO2'].max():.2f}")

