import { HttpContextToken} from '@angular/common/http';

export const API_KEY_LABEL = new HttpContextToken<string | null>(() => null);
