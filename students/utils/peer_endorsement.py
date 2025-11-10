# students/utils/peer_endorsement.py

def peer_endorsement_score(endorsements):
    """
    Calculate weighted peer endorsement score
    endorsements: list of dicts [{'peer': 'A', 'score': 4}, {'peer': 'B', 'score': 5}]
    returns: average float score
    """
    if not endorsements:
        return 0.0
    
    # Filter valid endorsements
    valid_endorsements = [e for e in endorsements if 1 <= e.get('score', 0) <= 5]
    
    if not valid_endorsements:
        return 0.0
    
    total = sum(e['score'] for e in valid_endorsements)
    return round(total / len(valid_endorsements), 2)