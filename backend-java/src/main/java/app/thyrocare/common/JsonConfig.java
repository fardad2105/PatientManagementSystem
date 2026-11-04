package app.thyrocare.common;

import java.io.IOException;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.deser.std.StdScalarDeserializer;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Converts Persian/Arabic digits to ASCII and blank strings to null for every incoming JSON string. */
@Configuration
public class JsonConfig {

    public static String toAsciiDigits(String value) {
        StringBuilder sb = new StringBuilder(value.length());
        for (char c : value.toCharArray()) {
            if (c >= '\u06F0' && c <= '\u06F9') sb.append((char) ('0' + c - '\u06F0'));
            else if (c >= '\u0660' && c <= '\u0669') sb.append((char) ('0' + c - '\u0660'));
            else sb.append(c);
        }
        return sb.toString();
    }

    @Bean
    public Module persianDigitsModule() {
        SimpleModule module = new SimpleModule("persian-digits");
        module.addDeserializer(String.class, new StdScalarDeserializer<>(String.class) {
            @Override
            public String deserialize(JsonParser p, DeserializationContext ctx) throws IOException {
                String raw = p.getValueAsString();
                if (raw == null) return null;
                String value = toAsciiDigits(raw);
                return value.isBlank() ? null : value;
            }
        });
        return module;
    }
}
